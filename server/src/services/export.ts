import PDFDocument from "pdfkit";

type PDFDoc = InstanceType<typeof PDFDocument>;

export interface ExportMessage {
    senderName: string;
    senderAvatar?: string;
    content: string;
    createdAt: Date;
    deleted: boolean;
}

interface GenerateParams {
    roomTitle: string;
    participantsLabel: string;
    messages: ExportMessage[];
    exportedAt: Date;
}

interface PdfWriterParams {
    roomTitle: string;
    participantsLabel: string;
    messageCount: number;
    exportedAt: Date;
}

const COLORS = {
    title: "#18181b",
    subtitle: "#52525b",
    headerBg: "#22c55e",
    headerText: "#ffffff",
    bubbleBg: "#f4f4f5",
    text: "#27272a",
    muted: "#71717a",
    divider: "#e4e4e7",
    deleted: "#a1a1aa",
};

function formatTimestamp(date: Date): string {
    return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export interface ConversationPdfWriter {
    doc: PDFDoc;
    writeMessage(message: ExportMessage): void;
    end(): void;
}

export function createConversationPdfWriter(params: PdfWriterParams): ConversationPdfWriter {
    const doc = new PDFDocument({ margin: 48, size: "A4" });

    const titleWidth = doc.widthOfString("ConvoTalk");
    doc.font("Helvetica-Bold").fontSize(22)
        .rect(0, 0, 200, 70)
        .fill(COLORS.headerBg);
    doc.fillColor("#ffffff").text("ConvoTalk", 48, 24, { width: titleWidth });

    doc.font("Helvetica").fontSize(10).fillColor(COLORS.headerText)
        .text(
            `Exportado em ${formatTimestamp(params.exportedAt)}`,
            250,
            30,
            { width: 300, align: "right" },
        );

    doc.y = 90;
    doc.font("Helvetica-Bold").fontSize(18).fillColor(COLORS.title)
        .text(params.roomTitle);

    doc.font("Helvetica").fontSize(10).fillColor(COLORS.subtitle)
        .text(params.participantsLabel);

    doc.moveDown(0.5);
    doc.moveTo(48, doc.y).lineTo(545, doc.y).lineWidth(1)
        .strokeColor(COLORS.divider).stroke();

    doc.moveDown(1);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.muted)
        .text(`${params.messageCount} mensagens`, { align: "right" });

    const pageHeight = doc.page.height - doc.page.margins.bottom;

    const writeMessage = (message: ExportMessage): void => {
        if (doc.y > pageHeight - 60) {
            doc.addPage();
        }

        const timestamp = formatTimestamp(message.createdAt);
        if (message.deleted) {
            doc.font("Helvetica-Oblique").fontSize(10).fillColor(COLORS.deleted)
                .text("(mensagem excluída)", { align: "center" });
            doc.moveDown(0.6);
            return;
        }

        const contentWidth = doc
          .font("Helvetica-Bold")
          .fontSize(12)
          .widthOfString(message.senderName);
        const timestampWidth = doc.widthOfString(timestamp);
        const lineWidth = contentWidth + timestampWidth + 20;
        const bubbleX = 48;
        const bubbleWidth = Math.max(160, Math.min(400, lineWidth));

        let startY = doc.y;
        doc.roundedRect(bubbleX, startY, bubbleWidth, 34, 8)
            .fill(COLORS.bubbleBg);

        doc.font("Helvetica-Bold").fontSize(12).fillColor(COLORS.text)
            .text(message.senderName, bubbleX + 12, startY + 8, { width: bubbleWidth - 24 });

        doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted)
            .text(timestamp, bubbleX + 12, startY + 24);

        const bodyY = startY + 34;
        doc.font("Helvetica").fontSize(11).fillColor(COLORS.text)
            .text(message.content, bubbleX, bodyY, {
                width: 497,
                lineGap: 3,
            });
        doc.y += 8;
    };

    return { doc, writeMessage, end: () => doc.end() };
}

export function generateConversationPdf(params: GenerateParams): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const { doc, writeMessage, end } = createConversationPdfWriter({
            roomTitle: params.roomTitle,
            participantsLabel: params.participantsLabel,
            messageCount: params.messages.length,
            exportedAt: params.exportedAt,
        });
        const chunks: Buffer[] = [];
        doc.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        for (const message of params.messages) {
            writeMessage(message);
        }
        end();
    });
}