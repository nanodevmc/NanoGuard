// NanoGuard FastScan — YARA-style Rule Engine
// Parses .ngrule files and matches against JAR class bytecode

use std::collections::HashMap;
use crate::malware::ThreatFinding;

#[derive(Debug, Clone, PartialEq)]
pub enum Severity {
    Critical,
    High,
    Medium,
    Low,
}

impl Severity {
    pub fn from_str(s: &str) -> Self {
        match s.to_uppercase().as_str() {
            "CRITICAL" => Severity::Critical,
            "HIGH"     => Severity::High,
            "MEDIUM"   => Severity::Medium,
            _          => Severity::Low,
        }
    }
    pub fn as_str(&self) -> &'static str {
        match self {
            Severity::Critical => "CRITICAL",
            Severity::High     => "HIGH",
            Severity::Medium   => "MEDIUM",
            Severity::Low      => "LOW",
        }
    }
}

#[derive(Debug, Clone)]
pub enum Pattern {
    StringPattern(String),
    BytePattern(Vec<Option<u8>>),
    RegexPattern(String),
}

#[derive(Debug, Clone)]
pub struct Rule {
    pub name:        String,
    pub description: String,
    pub severity:    Severity,
    pub author:      String,
    pub strings:     HashMap<String, Pattern>,
    pub condition:   String,
}

pub fn parse_rules(source: &str) -> Vec<Rule> {
    let mut rules = Vec::new();
    let lines: Vec<&str> = source.lines().collect();
    let mut i = 0;

    while i < lines.len() {
        let line = lines[i].trim();

        if line.starts_with("rule ") {
            let rule_name = line[5..].trim().trim_end_matches('{').trim().to_string();
            let mut rule = Rule {
                name:        rule_name,
                description: String::new(),
                severity:    Severity::Medium,
                author:      String::new(),
                strings:     HashMap::new(),
                condition:   String::new(),
            };

            i += 1;
            let mut section = "";

            while i < lines.len() {
                let l = lines[i].trim();

                if l == "}" {
                    break;
                } else if l == "meta:" {
                    section = "meta";
                } else if l == "strings:" {
                    section = "strings";
                } else if l == "condition:" {
                    section = "condition";
                } else if section == "meta" {
                    if let Some((k, v)) = parse_kv(l) {
                        match k {
                            "description" => rule.description = v.to_string(),
                            "severity"    => rule.severity = Severity::from_str(v),
                            "author"      => rule.author = v.to_string(),
                            _ => {}
                        }
                    }
                } else if section == "strings" {
                    if let Some((id, pat_str)) = parse_string_decl(l) {
                        if pat_str.starts_with('{') {
                            if let Some(bp) = parse_byte_pattern(&pat_str) {
                                rule.strings.insert(id, Pattern::BytePattern(bp));
                            }
                        } else {
                            rule.strings.insert(id, Pattern::StringPattern(pat_str));
                        }
                    }
                } else if section == "condition" && !l.is_empty() {
                    if !rule.condition.is_empty() { rule.condition.push(' '); }
                    rule.condition.push_str(l);
                }

                i += 1;
            }

            rules.push(rule);
        }

        i += 1;
    }

    rules
}

fn parse_kv(line: &str) -> Option<(&str, &str)> {
    let eq = line.find('=')?;
    let k = line[..eq].trim();
    let v = line[eq+1..].trim().trim_matches('"');
    Some((k, v))
}

fn parse_string_decl(line: &str) -> Option<(String, String)> {
    if !line.starts_with('$') { return None; }
    let eq = line.find('=')?;
    let id = line[..eq].trim().to_string();
    let raw = line[eq+1..].trim();
    let val = if raw.starts_with('"') && raw.ends_with('"') {
        raw[1..raw.len()-1].to_string()
    } else {
        raw.to_string()
    };
    Some((id, val))
}

fn parse_byte_pattern(s: &str) -> Option<Vec<Option<u8>>> {
    let inner = s.trim_start_matches('{').trim_end_matches('}').trim();
    let mut result = Vec::new();
    for tok in inner.split_whitespace() {
        if tok == "??" {
            result.push(None);
        } else if let Ok(b) = u8::from_str_radix(tok, 16) {
            result.push(Some(b));
        } else {
            return None;
        }
    }
    Some(result)
}

pub fn match_rule(rule: &Rule, class_bytes: &[u8], class_name: &str) -> Option<ThreatFinding> {
    let mut matched: HashMap<String, bool> = HashMap::new();

    for (id, pattern) in &rule.strings {
        let hit = match pattern {
            Pattern::StringPattern(s) => bytes_contains_string(class_bytes, s),
            Pattern::BytePattern(bp) => bytes_contains_pattern(class_bytes, bp),
            Pattern::RegexPattern(glob) => glob_match(glob, class_name),
        };
        matched.insert(id.clone(), hit);
    }

    if evaluate_condition(&rule.condition, &matched) {
        let matched_ids: Vec<String> = matched.iter()
            .filter(|(_, &v)| v)
            .map(|(k, _)| k.clone())
            .collect();
        Some(ThreatFinding {
            category: format!("YARA: {}", rule.name),
            description: rule.description.clone(),
            severity: rule.severity.as_str().to_string(),
            location: class_name.to_string(),
            instruction: Some(format!("Matched patterns: {}", matched_ids.join(", "))),
        })
    } else {
        None
    }
}

fn bytes_contains_string(haystack: &[u8], needle: &str) -> bool {
    let nb = needle.as_bytes();
    if nb.is_empty() { return true; }
    haystack.windows(nb.len()).any(|w| w == nb)
}

fn bytes_contains_pattern(haystack: &[u8], pattern: &[Option<u8>]) -> bool {
    if pattern.is_empty() { return true; }
    haystack.windows(pattern.len()).any(|w| {
        w.iter().zip(pattern.iter()).all(|(b, p)| p.map_or(true, |pb| *b == pb))
    })
}

fn glob_match(glob: &str, s: &str) -> bool {
    let parts: Vec<&str> = glob.split('*').collect();
    if parts.is_empty() { return true; }
    let mut pos = 0usize;
    for part in parts {
        if part.is_empty() { continue; }
        if let Some(found) = s[pos..].find(part) {
            pos += found + part.len();
        } else {
            return false;
        }
    }
    true
}

fn evaluate_condition(cond: &str, matched: &HashMap<String, bool>) -> bool {
    let tokens: Vec<&str> = cond.split_whitespace().collect();
    if tokens.is_empty() { return false; }

    let mut result = eval_token(tokens[0], matched);
    let mut i = 1;

    while i < tokens.len() {
        let op = tokens[i];
        i += 1;
        if i >= tokens.len() { break; }
        let rhs = eval_token(tokens[i], matched);
        i += 1;

        result = match op {
            "and" => result && rhs,
            "or"  => result || rhs,
            _     => result,
        };
    }

    result
}

fn eval_token(tok: &str, matched: &HashMap<String, bool>) -> bool {
    if tok == "true"  { return true; }
    if tok == "false" { return false; }
    let tok = tok.trim_matches('(').trim_matches(')');
    if tok.starts_with("not ") {
        return !eval_token(&tok[4..], matched);
    }
    *matched.get(tok).unwrap_or(&false)
}

pub fn builtin_rules() -> Vec<Rule> {
    parse_rules(r#"
rule ForceOP_Backdoor {
    meta:
        description = "Hidden OP grant via chat trigger"
        severity = CRITICAL
        author = "NanoDev"
    strings:
        $s1 = "setOp"
        $s2 = "AsyncPlayerChatEvent"
        $s3 = "PlayerCommandPreprocessEvent"
    condition:
        $s1 and ($s2 or $s3)
}

rule URLClassLoader_Dropper {
    meta:
        description = "Dynamic class loader dropper (malware downloader pattern)"
        severity = CRITICAL
        author = "NanoDev"
    strings:
        $s1 = "URLClassLoader"
        $s2 = "openConnection"
        $s3 = "defineClass"
    condition:
        $s1 and ($s2 or $s3)
}

rule Runtime_Exec_RCE {
    meta:
        description = "Runtime.exec() remote code execution vector"
        severity = HIGH
        author = "NanoDev"
    strings:
        $b1 = { B8 00 ?? B6 00 ?? }
        $s1 = "Runtime"
        $s2 = "exec"
    condition:
        $s1 and $s2
}

rule Discord_Token_Exfil {
    meta:
        description = "Discord token exfiltration (webhook or HTTP to discord.com)"
        severity = CRITICAL
        author = "NanoDev"
    strings:
        $s1 = "discord.com/api/webhooks"
        $s2 = "discord.gg"
        $s3 = "DISCORD_TOKEN"
        $s4 = "Authorization: Bot"
    condition:
        $s1 or $s2 or $s3 or $s4
}

rule Browser_Credential_Stealer {
    meta:
        description = "Browser saved credential harvesting"
        severity = CRITICAL
        author = "NanoDev"
    strings:
        $s1 = "Login Data"
        $s2 = "cookies"
        $s3 = "Local Storage"
        $s4 = "AppData"
    condition:
        $s1 or ($s2 and $s4)
}

rule Fractureiser_IOC {
    meta:
        description = "Fractureiser malware IOC signatures"
        severity = CRITICAL
        author = "NanoDev"
    strings:
        $s1 = "85.217.144.130"
        $s2 = "107.189.3.101"
        $s3 = "files.catbox.moe"
        $b1 = { 2A B6 00 ?? B8 00 ?? }
    condition:
        $s1 or $s2 or $s3
}

rule Allatori_Obfuscator {
    meta:
        description = "Allatori obfuscator fingerprint"
        severity = MEDIUM
        author = "NanoDev"
    strings:
        $s1 = "Allatori"
        $b1 = { CA }
    condition:
        $s1 or $b1
}

rule Zelix_KlassMaster {
    meta:
        description = "Zelix KlassMaster obfuscator fingerprint"
        severity = MEDIUM
        author = "NanoDev"
    strings:
        $s1 = "ZKM"
        $s2 = "Zelix"
    condition:
        $s1 or $s2
}

rule Persistence_Scheduler {
    meta:
        description = "Suspicious persistence via system scheduler or cron"
        severity = HIGH
        author = "NanoDev"
    strings:
        $s1 = "schtasks"
        $s2 = "crontab"
        $s3 = "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
    condition:
        $s1 or $s2 or $s3
}

rule Telegram_Exfil {
    meta:
        description = "Telegram bot API data exfiltration"
        severity = HIGH
        author = "NanoDev"
    strings:
        $s1 = "api.telegram.org/bot"
        $s2 = "sendMessage"
        $s3 = "sendDocument"
    condition:
        $s1 and ($s2 or $s3)
}

rule PermissionStar_Grant {
    meta:
        description = "Wildcard permission grant (PermissionAttachment *)"
        severity = HIGH
        author = "NanoDev"
    strings:
        $s1 = "PermissionAttachment"
        $s2 = "addAttachment"
        $s3 = "true"
    condition:
        $s1 and $s2
}
"#)
}
