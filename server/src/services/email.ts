import "dotenv/config";
import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend {
    if (!resend) {
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

const EMAIL_FROM =
    process.env.EMAIL_FROM || "ConvoTalk <onboarding@resend.dev>";

interface EmailTemplateParams {
    preheader: string;
    heading: string;
    content: string;
    cta?: {
        url: string;
        label: string;
    };
    footerNote?: string;
}

const BRAND_STYLES = {
    bg: "#0c0c0d",
    container: "#18181b",
    border: "#27272a",
    heading: "#fafafa",
    text: "#a1a1aa",
    muted: "#52525b",
    accent: "#16a34a",
    accentDark: "#15803d",
    onAccent: "#ffffff",
};

function buildEmailHtml(params: EmailTemplateParams): string {
    const year = new Date().getFullYear();
    const cta = params.cta
        ? `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" class="btn-table">
          <tr>
            <td class="btn-wrap">
              <a href="${params.cta.url}" class="btn" style="color: #ffffff; text-decoration: none;">${escapeHtml(params.cta.label)}</a>
            </td>
          </tr>
        </table>`
        : "";
    const footerNote = params.footerNote
        ? `<p class="footer-note">${escapeHtml(params.footerNote)}</p>`
        : "";

    return `
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta name="color-scheme" content="dark dark">
            <meta name="supported-color-schemes" content="dark">
            <title>ConvoTalk</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                background-color: ${BRAND_STYLES.bg};
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                -webkit-font-smoothing: antialiased;
              }
              .preheader {
                display: none;
                max-height: 0;
                overflow: hidden;
                visibility: hidden;
                opacity: 0;
                color: ${BRAND_STYLES.bg};
                font-size: 1px;
                line-height: 1px;
              }
              .email-body {
                background-color: ${BRAND_STYLES.bg};
                padding: 32px 16px;
              }
              .email-container {
                width: 100%;
                max-width: 480px;
                background-color: ${BRAND_STYLES.container};
                border: 1px solid ${BRAND_STYLES.border};
                border-radius: 20px;
                overflow: hidden;
              }
              .header {
                padding: 32px 32px 24px;
              }
              .brand {
                margin: 0;
                color: ${BRAND_STYLES.heading};
                font-size: 18px;
                font-weight: 700;
                text-align: center;
              }
              .divider {
                height: 1px;
                background-color: ${BRAND_STYLES.border};
                border: 0;
              }
              .divider-accent {
                height: 3px;
                background: linear-gradient(90deg, ${BRAND_STYLES.accent} 0%, rgba(22, 163, 74, 0) 100%);
                border: 0;
              }
              .content {
                padding: 28px 32px 32px;
              }
              h1 {
                margin: 0 0 16px;
                color: ${BRAND_STYLES.heading};
                font-size: 22px;
                line-height: 1.3;
                font-weight: 700;
              }
              p {
                margin: 0 0 16px;
                color: ${BRAND_STYLES.text};
                font-size: 15px;
                line-height: 1.6;
              }
              p:last-child {
                margin-bottom: 0;
              }
              .btn-table {
                margin: 24px auto 0;
              }
              .btn-wrap {
                border-radius: 12px;
                overflow: hidden;
              }
              .btn {
                display: block;
                padding: 14px 36px;
                background-color: ${BRAND_STYLES.accent};
                background-image: linear-gradient(180deg, ${BRAND_STYLES.accent} 0%, ${BRAND_STYLES.accentDark} 100%);
                color: ${BRAND_STYLES.onAccent} !important;
                font-size: 15px;
                font-weight: 700;
                text-decoration: none;
                text-align: center;
                border-radius: 12px;
              }
              .footer-note {
                margin-top: 24px;
                padding-top: 16px;
                border-top: 1px solid ${BRAND_STYLES.border};
                color: ${BRAND_STYLES.muted};
                font-size: 13px;
                text-align: center;
              }
              .footer {
                padding: 8px 32px 28px;
              }
              .footer-text {
                margin: 0;
                color: ${BRAND_STYLES.muted};
                font-size: 12px;
                line-height: 1.5;
                text-align: center;
              }
              @media (prefers-color-scheme: dark) {
                body { background-color: ${BRAND_STYLES.bg} !important; }
                .email-body { background-color: ${BRAND_STYLES.bg} !important; }
                .email-container { background-color: ${BRAND_STYLES.container} !important; }
              }
              @media (prefers-color-scheme: dark) {
                [data-ogsc] .email-body { background-color: ${BRAND_STYLES.bg} !important; }
                [data-ogsc] .email-container { background-color: ${BRAND_STYLES.container} !important; }
              }
              @media only screen and (max-width: 480px) {
                .email-body { padding: 16px 8px; }
                .header { padding: 24px 20px 16px; }
                .content { padding: 24px 20px; }
                .footer { padding: 8px 20px 20px; }
              }
            </style>
          </head>
          <body>
            <span class="preheader">${escapeHtml(params.preheader)}</span>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="center" class="email-body">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="email-container">
                    <tr>
                      <td class="header">
                        <p class="brand">ConvoTalk</p>
                      </td>
                    </tr>
                    <tr>
                      <td class="divider-accent"></td>
                    </tr>
                    <tr>
                      <td class="content">
                        <h1>${params.heading}</h1>
                        ${params.content}
                        ${cta}
                        ${footerNote}
                      </td>
                    </tr>
                    <tr>
                      <td class="footer">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                          <tr>
                            <td class="divider"></td>
                          </tr>
                        </table>
                        <p class="footer-text">
                          ConvoTalk &mdash; Converse em tempo real<br>
                          &copy; ${year} ConvoTalk
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;
}

export async function sendVerificationEmail(
    email: string,
    name: string,
    token: string,
): Promise<void> {
    const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email?token=${token}`;
    const safeName = escapeHtml(name);

    const html = buildEmailHtml({
        preheader: "Confirme seu email para começar a usar o ConvoTalk",
        heading: `Olá, ${safeName}!`,
        content: `
          <p>Obrigado por criar sua conta no ConvoTalk. Estamos felizes em ter você por aqui.</p>
          <p>Para começar a usar, confirme seu email clicando no botão abaixo.</p>
        `,
        cta: { url: verifyUrl, label: "Confirmar email" },
        footerNote: "Se você não criou uma conta, ignore este email.",
    });

    await getResend().emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: "Confirme seu email - ConvoTalk",
        html,
    });
}

export async function sendPasswordResetEmail(
    email: string,
    name: string,
    token: string,
): Promise<void> {
    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${token}`;
    const safeName = escapeHtml(name);

    const html = buildEmailHtml({
        preheader: "Redefina sua senha no ConvoTalk",
        heading: `Olá, ${safeName}!`,
        content: `
          <p>Recebemos uma solicitação para redefinir a senha da sua conta no ConvoTalk.</p>
          <p>Para definir uma nova senha, clique no botão abaixo.</p>
          <p>Este link é válido por <strong>1 hora</strong>. Se você não solicitou a redefinição, ignore este email e sua senha continuará inalterada.</p>
        `,
        cta: { url: resetUrl, label: "Redefinir senha" },
        footerNote:
            "Se você não solicitou a redefinição de senha, ignore este email.",
    });

    await getResend().emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: "Redefinição de senha - ConvoTalk",
        html,
    });
}
