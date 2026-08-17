import LegalLayout from "../components/LegalLayout";

interface SectionProps {
    icon: string;
    title: string;
    children: React.ReactNode;
    highlighted?: boolean;
}

function Section({ icon, title, children, highlighted }: SectionProps) {
    return (
        <section>
            <h2 className="text-xl leading-7 font-semibold text-on-surface mb-4 flex items-center gap-2">
                <span
                    className="material-symbols-outlined text-primary"
                    aria-hidden="true"
                >
                    {icon}
                </span>
                {title}
            </h2>
            {highlighted ? (
                <div className="bg-surface-container rounded-lg p-6 border border-outline-variant">
                    <div className="text-base text-on-surface-variant leading-relaxed">
                        {children}
                    </div>
                </div>
            ) : (
                <div className="text-base text-on-surface-variant leading-relaxed">
                    {children}
                </div>
            )}
        </section>
    );
}

function ProhibitedList({ items }: { items: string[] }) {
    return (
        <ul className="list-none space-y-3 text-base leading-6 text-on-surface-variant ml-2 border-l-2 border-surface-container-high pl-4">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                    <span
                        className="material-symbols-outlined text-error text-sm mt-1"
                        aria-hidden="true"
                    >
                        close
                    </span>
                    {item}
                </li>
            ))}
        </ul>
    );
}

export default function TermsPage() {
    const lastUpdated = new Date().toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <LegalLayout title="Termos de Uso" lastUpdated={lastUpdated}>
            <div className="space-y-12">
                <Section
                    icon="lock"
                    title="1. Privacidade e Proteção de Dados"
                    highlighted
                >
                    <p>
                        A sua privacidade é uma prioridade do ConvoTalk. O
                        tratamento dos seus dados pessoais é realizado em
                        conformidade com a Lei Geral de Proteção de Dados (Lei
                        nº 13.709/2018 - LGPD). Os detalhes completos sobre a
                        coleta, o uso e a proteção das suas informações estão
                        descritos na nossa{" "}
                        <a
                            href="/privacy"
                            className="text-primary hover:text-on-surface transition-colors"
                        >
                            Política de Privacidade
                        </a>
                        , que integra estes Termos.
                    </p>
                </Section>

                <Section icon="gavel" title="2. Responsabilidades do Usuário">
                    <p className="mb-4">
                        Ao utilizar nossa plataforma, você se compromete a ter
                        uma conduta apropriada e lícita. É estritamente proibido
                        o uso do ConvoTalk para:
                    </p>
                    <ProhibitedList
                        items={[
                            "Distribuir conteúdo ilegal, difamatório, abusivo, violento ou discriminatório.",
                            "Assediar, ameaçar ou intimidar outros usuários.",
                            "Tentar violar as medidas de segurança da plataforma ou disseminar malware.",
                            "Enviar mensagens em massa não solicitadas (spam) ou coletar dados de outros usuários sem consentimento.",
                            "Publicar conteúdo que viole direitos de terceiros, incluindo direitos autorais e de imagem.",
                            "Utilizar o serviço para finalidades ilícitas ou não autorizadas.",
                        ]}
                    />
                </Section>

                <Section icon="description" title="3. Conteúdo do Usuário">
                    <p>
                        Você mantém a titularidade dos conteúdos que publica no
                        ConvoTalk, incluindo mensagens, arquivos e imagens. Ao
                        publicar, você nos concede uma licença limitada para
                        armazenar, processar e transmitir tais conteúdos com a
                        finalidade exclusiva de operar e melhorar o serviço.
                    </p>
                    <p className="mt-4">
                        Você é o único responsável pelos conteúdos que publica e
                        pelo cumprimento da legislação aplicável.
                    </p>
                </Section>

                <Section icon="copyright" title="4. Propriedade Intelectual">
                    <p>
                        O ConvoTalk, incluindo seu nome, logotipo, código-fonte,
                        design e demais elementos distintivos, é de titularidade
                        exclusiva dos seus responsáveis. Nenhum elemento destes
                        Termos concede a você qualquer direito de propriedade
                        intelectual sobre o serviço.
                    </p>
                </Section>

                <Section
                    icon="info"
                    title="5. Disponibilidade e Isenção de Responsabilidade"
                >
                    <p>
                        O ConvoTalk é fornecido "no estado em que se encontra",
                        sem garantias de disponibilidade contínua, ausência de
                        erros ou adequação a finalidades específicas. Não
                        garantimos a entrega, integridade ou disponibilidade de
                        mensagens, chamadas ou arquivos transmitidos pelo
                        serviço.
                    </p>
                </Section>

                <Section
                    icon="balance"
                    title="6. Limitação de Responsabilidade"
                >
                    <p>
                        Na máxima extensão permitida pela legislação aplicável,
                        o ConvoTalk não será responsável por danos diretos,
                        indiretos, incidentais ou consequenciais decorrentes do
                        uso ou da impossibilidade de uso do serviço, incluindo
                        perda de dados, interrupções de comunicação, conteúdo
                        ofensivo enviado por outros usuários ou prejuízos
                        resultantes de chamadas de áudio ou vídeo.
                    </p>
                </Section>

                <Section icon="update" title="7. Alterações nos Termos">
                    <p>
                        O ConvoTalk reserva-se o direito de modificar estes
                        Termos a qualquer momento. Notificaremos os usuários
                        sobre mudanças significativas através da própria
                        plataforma ou por e-mail com pelo menos 30 dias de
                        antecedência antes que as novas condições entrem em
                        vigor.
                    </p>
                </Section>

                <Section icon="logout" title="8. Rescisão">
                    <p>
                        Você pode encerrar sua conta a qualquer momento na
                        página de Configurações, utilizando a opção "Excluir
                        minha conta". Reservamo-nos o direito de suspender ou
                        encerrar contas que violem estes Termos ou a legislação
                        aplicável, com ou sem aviso prévio.
                    </p>
                </Section>

                <Section icon="gavel" title="9. Lei Aplicável e Foro">
                    <p>
                        Estes Termos são regidos pelas leis da República
                        Federativa do Brasil, em especial pelo Marco Civil da
                        Internet (Lei nº 12.965/2014) e pela Lei Geral de
                        Proteção de Dados (Lei nº 13.709/2018 - LGPD). As partes
                        elegem o foro da comarca de domicílio do usuário para
                        dirimir quaisquer controvérsias decorrentes destes
                        Termos, sem prejuízo das disposições do Código de Defesa
                        do Consumidor quando aplicáveis.
                    </p>
                </Section>

                <Section icon="mail" title="10. Contato">
                    <p>
                        Para dúvidas, solicitações ou reclamações sobre estes
                        Termos, entre em contato conosco pelo e-mail de suporte
                        disponibilizado na página inicial ou no menu de
                        configurações.
                    </p>
                </Section>
            </div>
        </LegalLayout>
    );
}
