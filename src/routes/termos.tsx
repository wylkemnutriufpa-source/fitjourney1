import { createFileRoute, Link } from "@tanstack/react-router";
import { LogoOrbital } from "@/components/LogoOrbital";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — FitJourney" },
      { name: "description", content: "Termos de Uso da plataforma FitJourney." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
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
        <h1 className="font-display text-4xl font-bold mb-2">Termos de Uso</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Última atualização: {new Date().toLocaleDateString("pt-BR")}
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar a plataforma FitJourney, você concorda integralmente com estes
              Termos de Uso. Caso não concorde com qualquer disposição, não utilize o serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">2. Descrição do Serviço</h2>
            <p>
              A FitJourney é uma plataforma de nutrição clínica e esportiva voltada para nutricionistas
              e seus pacientes, oferecendo ferramentas de anamnese, planejamento alimentar,
              acompanhamento clínico e gamificação.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">3. Cadastro e Conta</h2>
            <p>
              O usuário é responsável pela veracidade das informações fornecidas e pela
              confidencialidade de suas credenciais de acesso. O uso indevido da conta é de inteira
              responsabilidade do titular.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">4. Responsabilidade Profissional</h2>
            <p>
              A FitJourney é uma ferramenta de apoio. Toda prescrição, conduta clínica e decisão
              terapêutica é de responsabilidade exclusiva do profissional nutricionista habilitado
              que utiliza a plataforma. A FitJourney não substitui o julgamento clínico profissional.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">5. Uso Permitido</h2>
            <p>
              É vedado utilizar a plataforma para fins ilícitos, compartilhar credenciais, tentar
              violar a segurança do sistema, fazer engenharia reversa ou reproduzir conteúdo sem
              autorização.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">6. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo, marca, software, design e tecnologia da FitJourney são de propriedade
              exclusiva da plataforma e protegidos pelas leis de propriedade intelectual aplicáveis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">7. Planos e Pagamentos</h2>
            <p>
              Os planos pagos são cobrados conforme as condições apresentadas no momento da
              contratação. O cancelamento pode ser solicitado a qualquer momento, sem reembolso de
              períodos já utilizados, salvo determinação legal em contrário.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">8. Modificações</h2>
            <p>
              A FitJourney reserva o direito de alterar estes Termos a qualquer momento. Alterações
              relevantes serão comunicadas pelos canais disponíveis na plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">9. Contato</h2>
            <p>
              Dúvidas sobre estes Termos podem ser enviadas para{" "}
              <a href="mailto:sistemafitjourney.suporte@gmail.com" className="text-primary hover:underline">
                sistemafitjourney.suporte@gmail.com
              </a>{" "}
              ou via WhatsApp{" "}
              <a href="https://wa.me/5591984155365" className="text-primary hover:underline">
                (91) 98415-5365
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border/30 flex gap-4 text-sm">
          <Link to="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>
          <Link to="/suporte" className="text-primary hover:underline">Suporte</Link>
          <Link to="/" className="text-muted-foreground hover:text-foreground">Voltar ao início</Link>
        </div>
      </main>
    </div>
  );
}
