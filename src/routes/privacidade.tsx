import { createFileRoute, Link } from "@tanstack/react-router";
import { LogoOrbital } from "@/components/LogoOrbital";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — FitJourney" },
      { name: "description", content: "Política de Privacidade da plataforma FitJourney." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <LogoOrbital size="size-10" />
            <span className="font-display font-bold text-lg">FitJourney</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display text-4xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Última atualização: {new Date().toLocaleDateString("pt-BR")}
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">1. Introdução</h2>
            <p>
              A FitJourney respeita a privacidade dos seus usuários e está em conformidade com a Lei
              Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018). Esta política descreve como
              coletamos, utilizamos e protegemos seus dados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">2. Dados Coletados</h2>
            <p>Coletamos os seguintes dados, conforme aplicável:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Dados cadastrais (nome, e-mail, telefone, CPF, CRN, quando aplicável);</li>
              <li>Dados clínicos e antropométricos fornecidos pelo profissional ou paciente;</li>
              <li>Dados de uso da plataforma (logs de acesso, IP, tipo de dispositivo);</li>
              <li>Dados de comunicação enviados via formulários de contato.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">3. Finalidade</h2>
            <p>Utilizamos seus dados para:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Prestar os serviços contratados;</li>
              <li>Permitir o acompanhamento clínico entre profissional e paciente;</li>
              <li>Melhorar a experiência e segurança da plataforma;</li>
              <li>Cumprir obrigações legais e regulatórias;</li>
              <li>Enviar comunicações sobre o serviço, novidades e promoções (com seu consentimento).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">4. Compartilhamento</h2>
            <p>
              Não vendemos seus dados. Compartilhamos informações apenas com prestadores de serviço
              essenciais à operação (hospedagem, processamento de pagamentos) sob obrigações de
              confidencialidade, ou quando exigido por lei.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">5. Segurança</h2>
            <p>
              Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo
              criptografia em trânsito, controle de acesso por função (RLS) e auditoria de eventos
              sensíveis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">6. Direitos do Titular</h2>
            <p>
              Você pode, a qualquer momento, solicitar: acesso, correção, anonimização, portabilidade
              ou eliminação dos seus dados, bem como revogação do consentimento. Para exercer seus
              direitos, entre em contato pelos canais de suporte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">7. Retenção</h2>
            <p>
              Os dados são mantidos pelo tempo necessário ao cumprimento das finalidades descritas e
              das obrigações legais aplicáveis. Após esse período, são eliminados ou anonimizados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">8. Cookies</h2>
            <p>
              Utilizamos cookies essenciais ao funcionamento da plataforma e cookies analíticos para
              entender o uso do serviço. Você pode gerenciá-los nas configurações do seu navegador.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">9. Contato do Encarregado (DPO)</h2>
            <p>
              Para questões relacionadas à proteção de dados, entre em contato:{" "}
              <a href="mailto:sistemafitjourney.suporte@gmail.com" className="text-primary hover:underline">
                sistemafitjourney.suporte@gmail.com
              </a>{" "}
              · WhatsApp:{" "}
              <a href="https://wa.me/5591984155365" className="text-primary hover:underline">
                (91) 98415-5365
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border/30 flex gap-4 text-sm">
          <Link to="/termos" className="text-primary hover:underline">Termos de Uso</Link>
          <Link to="/suporte" className="text-primary hover:underline">Suporte</Link>
          <Link to="/" className="text-muted-foreground hover:text-foreground">Voltar ao início</Link>
        </div>
      </main>
    </div>
  );
}
