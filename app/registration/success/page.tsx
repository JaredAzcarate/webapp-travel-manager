"use client";

import { PublicContent } from "@/common/components/PublicContent";
import { Alert, Button, Card, Steps, Typography } from "antd";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";

const { Title, Paragraph } = Typography;

const sectionAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

function sectionTransition(delay = 0) {
  return {
    duration: 0.4,
    delay,
    ease: [0.4, 0, 0.2, 1] as const,
  };
}

export default function RegistrationSuccessPage() {
  const router = useRouter();

  const steps = [
    {
      title: "Inscrição realizada",
      status: "finish" as const,
      content: (
        <span>
          A sua inscrição foi registrada com sucesso.
        </span>
      ),
    },
    {
      title: "Realizar pagamento",
      status: "process" as const,
      content: (
        <span>
          O valor da viagem é de <strong>10€</strong> para jovens e crianças
          (1-17 anos) ou <strong>25€</strong> para adultos (18+). O pagamento
          deve ser efetuado através da papeleta de doações na coluna
          &quot;outros&quot; na sua unidade.
        </span>
      ),
    },
    {
      title: "Confirmar pagamento",
      status: "process" as const,
      content: (
        <div className="flex flex-col gap-2">

        <span>
          Após realizar o pagamento, pode confirmar através da página de
          confirmação de pagamento.
        </span>
        <div>
        <Button
          type="primary"
          size="middle"
          onClick={() => router.push("/confirm-payment")}
        >
          Confirmar pagamento
        </Button>

        </div>
        </div>
      ),
    },
    {
      title: "Preparar-se para a viagem",
      status: "process" as const,
      content: (
        <div className="flex flex-col gap-2">

        <span>
          Preparamos um instrutivo para a viagem que pode ser descarregado abaixo.
        </span>
        <div>

        <Button
          type="default"
          size="middle"
          href="/documents/Instruções.pdf"
          target="_blank"
        >
          Baixar instrutivo
        </Button>

        </div>
        </div>
      ),
    },
  ];

  return (
    <PublicContent>
      <AnimatePresence>
        <motion.div
          initial={sectionAnimation.initial}
          animate={sectionAnimation.animate}
          exit={sectionAnimation.exit}
          transition={sectionTransition(0)}
        >
          <Alert
            title="A sua inscrição foi registrada com sucesso."
            description="Por favor, siga os passos abaixo para desfrutar da viagem."
            type="success"
            showIcon
            className="mb-8"
          />
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        <motion.div
          initial={sectionAnimation.initial}
          animate={sectionAnimation.animate}
          exit={sectionAnimation.exit}
          transition={sectionTransition(0.15)}
        >
          <Card>
            <div className="flex flex-col gap-4">
              <Title level={4}>Próximos passos:</Title>
              <Steps
                orientation="vertical"
                items={steps}
                size="default"
              />
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        <motion.div
          initial={sectionAnimation.initial}
          animate={sectionAnimation.animate}
          exit={sectionAnimation.exit}
          transition={sectionTransition(0.3)}
          className="mt-6"
        >
          <Button
            type="link"
            size="large"
            onClick={() => router.push("/")}
          >
            Voltar ao início
          </Button>
        </motion.div>
      </AnimatePresence>
    </PublicContent>
  );
}
