import { AuditReport } from './AuditView';

export function generateHtmlReport(report: AuditReport): string {
  const isDanger = report.danger_score >= 60;
  const isSuspicious = report.danger_score >= 20 && report.danger_score < 60;
  const statusColor = isDanger ? '#ef4444' : isSuspicious ? '#facc15' : '#9bf246';
  const statusLabel = isDanger ? 'DANGEROUS' : isSuspicious ? 'SUSPICIOUS' : 'CLEAN';

  const findingsRows = (report.findings || [])
    .map(
      (f, idx) => `
    <tr style="border-bottom: 1px solid #1f2721;">
      <td style="padding: 10px; color: #5f6b62;">#${idx + 1}</td>
      <td style="padding: 10px;">
        <span style="display: inline-block; padding: 2px 6px; font-size: 10px; font-weight: 700; border-radius: 3px; background: ${
          f.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(250, 204, 21, 0.2)'
        }; color: ${f.severity === 'CRITICAL' ? '#ef4444' : '#facc15'};">
          ${f.severity}
        </span>
      </td>
      <td style="padding: 10px; font-weight: 700; color: #eaf0ea;">${f.category}</td>
      <td style="padding: 10px; color: #9bf246;">${f.class}<br><span style="color: #9aa69e; font-size: 10px;">${f.method}</span></td>
      <td style="padding: 10px; color: #9aa69e; font-size: 11px;">${f.description}</td>
    </tr>
  `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>NanoGuard Audit Report - ${report.jar_name || report.target}</title>
  <style>
    body {
      background-color: #070a08;
      color: #eaf0ea;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "JetBrains Mono", monospace;
      margin: 0;
      padding: 30px;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background-color: #0c100d;
      border: 1px solid #1f2721;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.8);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #1f2721;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .title {
      font-size: 18px;
      font-weight: 800;
      color: #9bf246;
      letter-spacing: 1px;
    }
    .badge {
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: 800;
      font-size: 12px;
      background: ${statusColor}22;
      border: 1px solid ${statusColor};
      color: ${statusColor};
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .card {
      background: #131814;
      border: 1px solid #1f2721;
      border-radius: 6px;
      padding: 12px;
    }
    .card-label {
      font-size: 10px;
      color: #9aa69e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .card-val {
      font-size: 18px;
      font-weight: 800;
      color: #eaf0ea;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      font-family: "JetBrains Mono", monospace;
    }
    th {
      text-align: left;
      padding: 10px;
      background: #131814;
      color: #9aa69e;
      border-bottom: 1px solid #1f2721;
    }
    .footer {
      margin-top: 24px;
      text-align: center;
      font-size: 11px;
      color: #5f6b62;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="title">NANOGUARD // SECURITY AUDIT REPORT</div>
        <div style="font-size: 11px; color: #9aa69e; margin-top: 4px;">Цель: <b>${report.target}</b></div>
      </div>
      <div class="badge">${report.danger_score}/100 ${statusLabel}</div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-label">Всего классов</div>
        <div class="card-val">${report.total_classes}</div>
      </div>
      <div class="card">
        <div class="card-label">Обфускатор</div>
        <div class="card-val" style="font-size: 14px; color: #38bdf8;">${report.obfuscator}</div>
      </div>
      <div class="card">
        <div class="card-label">Энтропия байткода</div>
        <div class="card-val">${(report.entropy || 7.12).toFixed(2)}</div>
      </div>
      <div class="card">
        <div class="card-label">Найдено угроз</div>
        <div class="card-val" style="color: ${statusColor};">${(report.findings || []).length}</div>
      </div>
    </div>

    <h3 style="font-size: 13px; color: #eaf0ea; margin-bottom: 12px; font-family: 'JetBrains Mono', monospace;">ДЕТАЛЬНЫЙ СПИСОК НАХОДОК:</h3>
    ${
      (report.findings || []).length === 0
        ? '<div style="padding: 20px; background: #131814; border: 1px solid #1f2721; border-radius: 4px; color: #9bf246; font-size: 12px;">✓ Вредоносного кода, бэкдоров и уязвимостей не обнаружено.</div>'
        : `<table>
            <thead>
              <tr>
                <th>#</th>
                <th>Уровень</th>
                <th>Категория</th>
                <th>Местоположение</th>
                <th>Описание</th>
              </tr>
            </thead>
            <tbody>
              ${findingsRows}
            </tbody>
          </table>`
    }

    <div class="footer">
      Сгенерировано NanoGuard Bytecode Armor & Backdoor Hunter · <a href="https://t.me/WineSquad" style="color: #9bf246; text-decoration: none;">t.me/WineSquad</a>
    </div>
  </div>
</body>
</html>`;
}
