"use client";

import { PublicContent } from "@/common/components/PublicContent";
import { Button, Card, Steps, Typography } from "antd";
import { useRouter } from "next/navigation";
import { CheckCircle } from "phosphor-react";

const { Title, Paragraph } = Typography;

export default function RegistrationSuccessPage() {
  const router = useRouter();

  const steps = [
    {
      title: "Inscrição realizada",
      status: "finish" as const,
      description: (
        <span>
          A sua inscrição foi registrada com sucesso.
        </span>
      ),
    },
    {
      title: "Realizar pagamento",
      status: "process" as const,
      description: (
        <span>
          Para realizar o pagamento da viagem é necessário fazer uma doação através da papeleta de doações na coluna
          &quot;outros&quot; na sua unidade.
        </span>
      ),
    },
    {
      title: "Confirmar pagamento",
      status: "process" as const,
      description: (
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
  ];

  return (
    <PublicContent>
      <div className="max-w-3xl mx-auto">
        <Card className="text-center">
          <div className="mb-6">
            <CheckCircle size={64} className="text-green-500 mx-auto" />
          </div>
          <Title level={2}>Inscrição realizada com sucesso!</Title>
          <Paragraph className="text-lg mt-4 mb-8">
            A sua inscrição foi registrada com sucesso. Receberá mais
            informações em breve.
          </Paragraph>
        </Card>

        <Card className="mt-6">
          <Title level={4} className="mb-6">
            Próximos passos:
          </Title>
          <Steps
            direction="vertical"
            items={steps}
            className="mb-8"
            size="default"
          />

          <div className="flex gap-4 justify-center mt-8">
            <Button
              type="primary"
              size="large"
              onClick={() => router.push("/confirm-payment")}
            >
              Confirmar pagamento
            </Button>
            <Button size="large" onClick={() => router.push("/")}>
              Voltar ao início
            </Button>
          </div>
        </Card>
      </div>
    </PublicContent>
  );
}
