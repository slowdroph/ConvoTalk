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

function DataCard({ title, items }: { title: string; items: string[] }) {
    return (
        <div className="bg-surface-container-low p-5 rounded border border-outline-variant">
            <h3 className="text-[13px] leading-4.5 tracking-[0.02em] font-medium text-on-surface mb-2">
                {title}
            </h3>
            <ul className="text-sm leading-5 text-on-surface-variant space-y-1 list-disc list-inside">
                {items.map((item, i) => (
                    <li key={i}>{item}</li>
                ))}
            </ul>
        </div>
    );
}

export default function PrivacyPage() {
    const lastUpdated = new Date().toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <LegalLayout title="Política de Privacidade" lastUpdated={lastUpdated}>
            <div className="space-y-12">
                <Section icon="lock" title="1. Introdução" highlighted>
                    <p>
                        Esta Política de Privacidade descreve como o ConvoTalk
                        coleta, utiliza, armazena e protege os dados pessoais de
                        seus usuários, em conformidade com a Lei Geral de
                        Proteção de Dados (Lei nº 13.709/2018 - LGPD) e demais
                        legislações aplicáveis. Ao utilizar o serviço, você
                        declara estar ciente e de acordo com as práticas aqui
                        descritas.
                    </p>
                </Section>

                <Section icon="database" title="2. Dados Pessoais Coletados">
                    <p className="mb-4">
                        Coletamos apenas o mínimo necessário para o fornecimento
                        dos nossos serviços. A transparência é fundamental para
                        nós:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 mt-6">
                        <DataCard
                            title="O que armazenamos:"
                            items={[
                                "Nome, e-mail e senha (criptografada) do cadastro.",
                                "Foto de perfil, status e preferências de notificação.",
                                "Conteúdo de mensagens e arquivos enviados.",
                                "Dados de atividade: último acesso, presença online e IP para fins de segurança.",
                            ]}
                        />
                        <DataCard
                            title="O que NÃO coletamos:"
                            items={[
                                "Nenhum dado de geolocalização ou rastreamento.",
                                "Nenhuma informação de impressão digital do dispositivo.",
                                "Nenhum dado de navegação, contatos ou redes sociais.",
                                "Nenhum dado financeiro ou de identificação governamental.",
                            ]}
                        />
                    </div>
                </Section>

                <Section icon="target" title="3. Finalidades do Tratamento">
                    <p>
                        Utilizamos seus dados pessoais para as seguintes
                        finalidades:
                    </p>
                    <ul className="mt-4 space-y-2 list-disc list-inside">
                        <li>
                            Fornecimento e operação do serviço de mensagens;
                        </li>
                        <li>
                            Autenticação e segurança da conta, incluindo
                            verificação de e-mail e redefinição de senha;
                        </li>
                        <li>
                            Armazenamento e transmissão de mensagens, arquivos e
                            chamadas;
                        </li>
                        <li>
                            Melhoria contínua do serviço e prevenção de fraudes
                            e abusos;
                        </li>
                        <li>
                            Cumprimento de obrigações legais e regulatórias.
                        </li>
                    </ul>
                </Section>

                <Section icon="balance" title="4. Base Legal para o Tratamento">
                    <p>
                        O tratamento de dados realizado pelo ConvoTalk
                        fundamenta-se nas seguintes bases legais da LGPD:
                    </p>
                    <ul className="mt-4 space-y-2 list-disc list-inside">
                        <li>
                            <strong>Consentimento</strong> (Art. 7º, I): para o
                            tratamento de dados de perfil e preferências;
                        </li>
                        <li>
                            <strong>Execução de contrato</strong> (Art. 7º, V):
                            para o fornecimento do serviço contratado ao criar a
                            conta;
                        </li>
                        <li>
                            <strong>Legítimo interesse</strong> (Art. 7º, IX):
                            para segurança, prevenção de fraudes e melhoria do
                            serviço;
                        </li>
                        <li>
                            <strong>Cumprimento de obrigação legal</strong>{" "}
                            (Art. 7º, II): quando aplicável.
                        </li>
                    </ul>
                </Section>

                <Section icon="share" title="5. Compartilhamento de Dados">
                    <p>
                        O ConvoTalk não vende, aluga ou comercializa dados
                        pessoais. Seus dados podem ser compartilhados apenas com
                        prestadores de serviços essenciais ao funcionamento da
                        plataforma, que atuam como operadores sob nossas
                        instruções:
                    </p>
                    <ul className="mt-4 space-y-2 list-disc list-inside">
                        <li>
                            <strong>MongoDB Atlas</strong>: armazenamento da
                            base de dados;
                        </li>
                        <li>
                            <strong>Cloudinary</strong>: hospedagem de imagens e
                            arquivos enviados;
                        </li>
                        <li>
                            <strong>Resend</strong>: envio de e-mails
                            transacionais (verificação e redefinição de senha);
                        </li>
                        <li>
                            <strong>Servidor STUN do Google</strong>:
                            facilitação de chamadas de áudio e vídeo ponto a
                            ponto.
                        </li>
                    </ul>
                    <p className="mt-4">
                        Alguns desses prestadores podem estar localizados fora
                        do Brasil, o que implica transferência internacional de
                        dados, realizada em conformidade com o Art. 33 da LGPD e
                        com as garantias adequadas de segurança.
                    </p>
                </Section>

                <Section
                    icon="cookie"
                    title="6. Cookies e Tecnologias Semelhantes"
                >
                    <p>
                        Utilizamos apenas um cookie funcional e estritamente
                        necessário para a autenticação da sessão (cookie{" "}
                        <em>refresh_token</em>, HTTP-only e criptografado em
                        produção). Não utilizamos cookies de rastreamento,
                        publicidade ou análise de comportamento de terceiros.
                    </p>
                    <p className="mt-4">
                        Além disso, utilizamos o armazenamento local do
                        navegador (localStorage e IndexedDB) para manter sua
                        sessão, preferências de tema e notificação e uma fila
                        offline de mensagens pendentes. Esses dados permanecem
                        no seu dispositivo e não são enviados a terceiros.
                    </p>
                </Section>

                <Section icon="schedule" title="7. Retenção de Dados">
                    <p>
                        Seus dados são mantidos pelo período necessário ao
                        cumprimento das finalidades descritas nesta política ou
                        enquanto sua conta estiver ativa. Mensagens e arquivos
                        são retidos até a exclusão da conta ou a exclusão
                        individual pelo usuário.
                    </p>
                    <p className="mt-4">
                        Logs de auditoria contendo endereço de IP são mantidos
                        exclusivamente para fins de segurança, prevenção de
                        fraudes e conformidade legal.
                    </p>
                </Section>

                <Section
                    icon="check_circle"
                    title="8. Seus Direitos (LGPD, Art. 18)"
                >
                    <p className="mb-4">
                        Em conformidade com a LGPD, você tem o direito de:
                    </p>
                    <ul className="list-none space-y-3 text-base leading-6 text-on-surface-variant ml-2 border-l-2 border-surface-container-high pl-4">
                        {[
                            "Confirmar a existência de tratamento de seus dados (Art. 18, I).",
                            "Acessar seus dados pessoais (Art. 18, II).",
                            "Corrigir dados incompletos, inexatos ou desatualizados (Art. 18, III).",
                            "Solicitar a portabilidade dos dados a outro fornecedor (Art. 18, V).",
                            "Solicitar a exclusão dos dados tratados com base no consentimento (Art. 18, VI).",
                            "Revogar o consentimento a qualquer momento (Art. 8º, §5º).",
                            "Solicitar informações sobre o compartilhamento de dados (Art. 18, VII).",
                        ].map((right, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <span
                                    className="material-symbols-outlined text-primary text-sm mt-1"
                                    aria-hidden="true"
                                >
                                    check_circle
                                </span>
                                {right}
                            </li>
                        ))}
                    </ul>
                    <p className="mt-4">
                        Você pode exercer a maioria desses direitos diretamente
                        no serviço, por meio das configurações da conta,
                        incluindo edição de perfil e exclusão da conta. Para
                        demais solicitações, entre em contato pelo e-mail
                        indicado na seção de contato.
                    </p>
                </Section>

                <Section
                    icon="shield"
                    title="9. Segurança dos Dados"
                    highlighted
                >
                    <p>
                        Adotamos medidas técnicas e organizacionais apropriadas
                        para proteger seus dados contra acesso não autorizado,
                        perda, alteração ou destruição, incluindo: senhas
                        armazenadas com hash seguro (bcrypt), autenticação por
                        tokens JWT de curta duração e cookies HTTP-only,
                        comunicação criptografada via HTTPS e limitação de taxas
                        em endpoints sensíveis para prevenir ataques de força
                        bruta.
                    </p>
                </Section>

                <Section icon="person_off" title="10. Menores de Idade">
                    <p>
                        O ConvoTalk destina-se a maiores de 18 anos. Não
                        coletamos intencionalmente dados pessoais de menores de
                        idade. Caso tome conhecimento de que um menor de 18 anos
                        criou uma conta, excluiremos os dados imediatamente.
                    </p>
                </Section>

                <Section
                    icon="support_agent"
                    title="11. Encarregado de Proteção de Dados (DPO)"
                >
                    <p>
                        Nos termos do Art. 41 da LGPD, o ConvoTalk disponibiliza
                        um Encarregado de Proteção de Dados para tratar questões
                        relacionadas ao tratamento de dados pessoais. O contato
                        do Encarregado é o mesmo canal indicado na seção de
                        contato desta política.
                    </p>
                </Section>

                <Section icon="update" title="12. Alterações desta Política">
                    <p>
                        Esta Política de Privacidade pode ser atualizada
                        periodicamente. Alterações relevantes serão comunicadas
                        pelo próprio serviço ou pelo e-mail cadastrado. A data
                        de última atualização é indicada no início desta página.
                    </p>
                </Section>

                <Section icon="mail" title="13. Contato">
                    <p>
                        Para exercer seus direitos, esclarecer dúvidas ou
                        apresentar solicitações relacionadas à privacidade e ao
                        tratamento de dados, entre em contato conosco pelo
                        e-mail de suporte disponibilizado na página inicial ou
                        no menu de configurações.
                    </p>
                    <p className="mt-4">
                        Você também pode entrar em contato com a Autoridade
                        Nacional de Proteção de Dados (ANPD) em caso de eventual
                        descumprimento da LGPD.
                    </p>
                </Section>
            </div>
        </LegalLayout>
    );
}
