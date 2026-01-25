"use client";

import { PublicContent } from "@/common/components/PublicContent";
import { Button, Card, Typography } from "antd";
import { useRouter } from "next/navigation";
import { CheckCircle } from "phosphor-react";

const { Title, Paragraph } = Typography;

export default function RegistrationSuccessPage() {
  const router = useRouter();

  return (
    <PublicContent>
      <Card className="text-center">
        <div className="mb-6">
          <CheckCircle size={64} className="text-green-500 mx-auto" />
        </div>
        <Title level={2}>Inscrição realizada com sucesso!</Title>
        <Paragraph className="text-lg mt-4">
          A sua inscrição foi registrada com sucesso. Receberá mais
          informações em breve.
        </Paragraph>

        <div className="mt-8 space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <Title level={4}>Próximos passos:</Title>
            <ul className="text-left mt-2 space-y-2">
              <li>
                O valor da viagem é de <strong>25 euros</strong> (exceto para
                recém-conversos, que viajam gratuitamente).
              </li>
              <li>
                O pagamento deve ser feito através da papeleta de doações na
                coluna "outros" na sua unidade.
              </li>
              <li>
                Após realizar o pagamento, pode confirmar através da página de
                confirmação de pagamento.
              </li>
            </ul>
          </div>

          <div className="flex gap-4 justify-center mt-6">
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
        </div>
      </Card>
    </PublicContent>
  );
}
