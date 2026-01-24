"use client";

import { useActiveCaravans } from "@/features/caravans/hooks/caravans.hooks";
import { Button, Card, Spin, Typography } from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

const { Title, Paragraph, Text } = Typography;

export default function HomePage() {
  const router = useRouter();
  const { caravans, loading } = useActiveCaravans();

  const activeCaravan = useMemo(() => {
    if (caravans.length === 0) return null;
    return caravans[0];
  }, [caravans]);

  const isFormOpen = useMemo(() => {
    if (!activeCaravan) return false;
    const now = new Date();
    const formOpenAt = activeCaravan.formOpenAt?.toDate();
    const formCloseAt = activeCaravan.formCloseAt?.toDate();

    if (!formOpenAt || !formCloseAt) return false;

    return now >= formOpenAt && now <= formCloseAt;
  }, [activeCaravan]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Title level={1} className="text-2xl sm:text-3xl md:text-4xl">
            Caravanas para o Templo
          </Title>
          <Paragraph className="text-sm sm:text-base md:text-lg text-gray-600">
            Sistema de gestão de inscrições para caravanas ao Templo de Lisboa
          </Paragraph>
        </div>

        {activeCaravan ? (
          <Card className="shadow-lg">
            <div className="flex items-center justify-center bg-blue-100 p-1 w-10 h-10 rounded-md">
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M19.75 15v5.75h-5.409v-3.637A2.343 2.343 0 0 0 12 14.772a2.343 2.343 0 0 0-2.341 2.341v3.637H4.25V15h-.056l6.223-3.007c.208-.1.358-.29.407-.516L12 6.045l1.176 5.432a.748.748 0 0 0 .407.516L19.806 15h-.056zm-5.185-4.198l-1.832-8.461c-.171-.788-1.295-.788-1.466 0l-1.832 8.461-7.761 3.75a.75.75 0 1 0 .652 1.351l.424-.205V21.5c0 .414.336.75.75.75h17a.75.75 0 0 0 .75-.75v-5.802l.424.205a.75.75 0 1 0 .652-1.351l-7.761-3.75z"></path>
              </svg>
            </div>
            <div className="space-y-6">
              <div>
                <Title level={2}>{activeCaravan.name}</Title>
                <div className="mt-4 space-y-2">
                  <div>
                    <Text strong>Partida: </Text>
                    <Text>
                      {activeCaravan.departureAt &&
                      "toDate" in activeCaravan.departureAt
                        ? dayjs(activeCaravan.departureAt.toDate()).format(
                            "DD/MM/YYYY HH:mm"
                          )
                        : "-"}
                    </Text>
                  </div>
                  <div>
                    <Text strong>Regresso: </Text>
                    <Text>
                      {activeCaravan.returnAt &&
                      "toDate" in activeCaravan.returnAt
                        ? dayjs(activeCaravan.returnAt.toDate()).format(
                            "DD/MM/YYYY HH:mm"
                          )
                        : "-"}
                    </Text>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Text strong>Estado do formulário: </Text>
                {isFormOpen ? (
                  <Text className="text-green-600">Aberto para inscrições</Text>
                ) : (
                  <Text className="text-gray-500">Fechado</Text>
                )}
              </div>

              {isFormOpen && (
                <div className="pt-4">
                  <Button
                    type="primary"
                    size="large"
                    block
                    onClick={() =>
                      router.push(`/registration/${activeCaravan.id}`)
                    }
                  >
                    Inscrever-se
                  </Button>
                </div>
              )}

              {!isFormOpen && activeCaravan.formOpenAt && (
                <div className="pt-4">
                  <Text className="text-gray-600">
                    O formulário de inscrição{" "}
                    {activeCaravan.formOpenAt &&
                    "toDate" in activeCaravan.formOpenAt
                      ? dayjs(activeCaravan.formOpenAt.toDate()).isAfter(
                          new Date()
                        )
                        ? `abrirá em ${dayjs(
                            activeCaravan.formOpenAt.toDate()
                          ).format("DD/MM/YYYY HH:mm")}`
                        : `fechou em ${dayjs(
                            activeCaravan.formCloseAt?.toDate()
                          ).format("DD/MM/YYYY HH:mm")}`
                      : ""}
                  </Text>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card className="shadow-lg">
            <div className="text-center py-8">
              <Title level={3}>Nenhuma caravana ativa</Title>
              <Paragraph className="text-gray-600 mt-4">
                Não há caravanas com inscrições abertas no momento.
              </Paragraph>
            </div>
          </Card>
        )}

        <div className="mt-8 text-center">
          <Button type="link" onClick={() => router.push("/confirm-payment")}>
            Confirmar pagamento ou verificar inscrições
          </Button>
        </div>
      </div>
    </div>
  );
}
