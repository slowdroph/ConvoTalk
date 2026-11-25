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

function wrapLines(doc: PDFDoc, text: string, maxWidth: number): string[] {
    const paragraphs = text.split("\n");
    const lines: string[] = [];
    for (const paragraph of paragraphs) {
        if (paragraph.length === 0) {
            lines.push("");
            continue;
        }
        const words = paragraph.split(/\s+/);
        let current = "";
        for (const word of words) {
            const candidate = current ? `${current} ${word}` : word;
            if (doc.widthOfString(candidate) <= maxWidth) {
                current = candidate;
                continue;
            }
            if (current) {
                lines.push(current);
                current = "";
            }
            if (doc.widthOfString(word) <= maxWidth) {
                current = word;
            } else {
                let chunk = "";
                for (const char of word) {
                    if (doc.widthOfString(chunk + char) > maxWidth) {
                        if (chunk) lines.push(chunk);
                        chunk = char;
                    } else {
                        chunk += char;
                    }
                }
                current = chunk;
            }
        }
        if (current) lines.push(current);
    }
    return lines.length > 0 ? lines : [""];
}

export function createConversationPdfWriter(
    params: PdfWriterParams,
): ConversationPdfWriter {
    const doc = new PDFDocument({ margin: 48, size: "A4" });

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const marginX = doc.page.margins.left;
    const contentWidth =
        pageWidth - doc.page.margins.left - doc.page.margins.right;
    const pageBottom = pageHeight - doc.page.margins.bottom;

    doc.font("Helvetica-Bold")
        .fontSize(22)
        .rect(0, 0, 200, 70)
        .fill(COLORS.headerBg);
    doc.fillColor("#ffffff").text("ConvoTalk", marginX, 24, {
        width: 200 - marginX,
    });

    doc.font("Helvetica")
        .fontSize(10)
        .fillColor(COLORS.headerText)
        .text(`Exportado em ${formatTimestamp(params.exportedAt)}`, 250, 30, {
            width: pageWidth - marginX - 250,
            align: "right",
        });

    doc.y = 90;
    doc.font("Helvetica-Bold")
        .fontSize(18)
        .fillColor(COLORS.title)
        .text(params.roomTitle, marginX, doc.y, { width: contentWidth });

    doc.font("Helvetica")
        .fontSize(10)
        .fillColor(COLORS.subtitle)
        .text(params.participantsLabel, marginX, doc.y, {
            width: contentWidth,
        });

    doc.moveDown(0.5);
    const dividerY = doc.y;
    doc.moveTo(marginX, dividerY)
        .lineTo(pageWidth - marginX, dividerY)
        .lineWidth(1)
        .strokeColor(COLORS.divider)
        .stroke();

    doc.moveDown(1);
    doc.font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(COLORS.muted)
        .text(`${params.messageCount} mensagens`, marginX, doc.y, {
            width: contentWidth,
            align: "right",
        });

    doc.moveDown(0.8);

    const bubbleWidth = Math.min(contentWidth, 420);
    const padding = 12;
    const textWidth = bubbleWidth - padding * 2;
    const nameHeight = 16;
    const headerHeight = padding + nameHeight + 12;
    const lineHeight = 14;
    const gap = 10;
    const contentHeight = pageBottom - marginX;

    const drawHeader = (senderName: string, createdAt: Date, topY: number) => {
        doc.font("Helvetica-Bold")
            .fontSize(12)
            .fillColor(COLORS.text)
            .text(senderName, marginX + padding, topY + padding, {
                width: textWidth,
            });
        doc.font("Helvetica")
            .fontSize(9)
            .fillColor(COLORS.muted)
            .text(
                formatTimestamp(createdAt),
                marginX + padding,
                topY + padding + nameHeight,
                { width: textWidth },
            );
    };

    const writeMessage = (message: ExportMessage): void => {
        if (message.deleted) {
            if (doc.y + 24 > pageBottom) doc.addPage();
            doc.font("Helvetica-Oblique")
                .fontSize(10)
                .fillColor(COLORS.deleted)
                .text("(mensagem excluída)", marginX, doc.y, {
                    width: contentWidth,
                    align: "center",
                });
            doc.y += 18;
            return;
        }

        doc.font("Helvetica").fontSize(11);
        const lines = wrapLines(doc, message.content, textWidth);
        const bodyHeight = lines.length * lineHeight;
        const bubbleHeight = headerHeight + bodyHeight + padding;

        if (bubbleHeight <= contentHeight) {
            if (doc.y + bubbleHeight > pageBottom) doc.addPage();
            const startY = doc.y;

            doc.roundedRect(marginX, startY, bubbleWidth, bubbleHeight, 8).fill(
                COLORS.bubbleBg,
            );
            drawHeader(message.senderName, message.createdAt, startY);

            doc.font("Helvetica").fontSize(11).fillColor(COLORS.text);
            let y = startY + headerHeight;
            for (const line of lines) {
                doc.text(line, marginX + padding, y, {
                    width: textWidth,
                    lineBreak: false,
                });
                y += lineHeight;
            }

            doc.y = startY + bubbleHeight + gap;
            return;
        }

        let index = 0;
        let segment = 0;
        while (index < lines.length) {
            if (segment === 0) {
                if (doc.y + headerHeight + lineHeight > pageBottom)
                    doc.addPage();
                const startY = doc.y;
                const available =
                    pageBottom - (startY + headerHeight) - padding;
                const fit = Math.max(1, Math.floor(available / lineHeight));
                const chunk = lines.slice(0, fit);
                const segHeight =
                    headerHeight + chunk.length * lineHeight + padding;

                doc.roundedRect(
                    marginX,
                    startY,
                    bubbleWidth,
                    segHeight,
                    8,
                ).fill(COLORS.bubbleBg);
                drawHeader(message.senderName, message.createdAt, startY);

                doc.font("Helvetica").fontSize(11).fillColor(COLORS.text);
                let y = startY + headerHeight;
                for (const line of chunk) {
                    doc.text(line, marginX + padding, y, {
                        width: textWidth,
                        lineBreak: false,
                    });
                    y += lineHeight;
                }
                index = chunk.length;
                doc.y = startY + segHeight + gap;
            } else {
                if (doc.y + 16 + lineHeight > pageBottom) doc.addPage();
                const contY = doc.y;
                doc.font("Helvetica-Oblique")
                    .fontSize(9)
                    .fillColor(COLORS.muted)
                    .text("(continuação)", marginX + padding, contY, {
                        width: textWidth,
                    });
                const available = pageBottom - (contY + 16) - padding;
                const fit = Math.max(1, Math.floor(available / lineHeight));
                const chunk = lines.slice(index, index + fit);

                doc.font("Helvetica").fontSize(11).fillColor(COLORS.text);
                let y = contY + 16;
                for (const line of chunk) {
                    doc.text(line, marginX + padding, y, {
                        width: textWidth,
                        lineBreak: false,
                    });
                    y += lineHeight;
                }
                index += chunk.length;
                doc.y = contY + 16 + chunk.length * lineHeight + gap;
            }
            segment += 1;
        }
    };

    return { doc, writeMessage, end: () => doc.end() };
}

export function generateConversationPdf(
    params: GenerateParams,
): Promise<Buffer> {
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
