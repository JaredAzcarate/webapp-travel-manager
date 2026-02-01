"use client";

import { PublicContent } from "@/common/components/PublicContent";
import { dataAccessLogsRepository } from "@/common/lib/repositories/dataAccessLogs.repository";
import { DataAccessLogWithId } from "@/common/models/dataAccessLogs.model";
import { useCaravan } from "@/features/caravans/hooks/caravans.hooks";
import { useChapel } from "@/features/chapels/hooks/chapels.hooks";
import { useOrdinances } from "@/features/ordinances/hooks/ordinances.hooks";
import { useDeleteAllData, useExportData, useRegistrationByUuid, useWithdrawConsent } from "@/features/registrations/hooks/gdpr.hooks";
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Space,
  Spin,
  Typography
} from "antd";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

const { Title, Paragraph } = Typography;

const pageAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
};

const cardAnimation = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

function cardTransition(delay = 0) {
  return { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const, delay };
}

function MyDataContent() {
  const { notification, modal } = App.useApp();
  const searchParams = useSearchParams();
  const uuid = searchParams.get("uuid");

  const { registration, loading: registrationLoading } = useRegistrationByUuid(uuid);
  const { caravan, loading: caravanLoading } = useCaravan(registration?.caravanId || "");
  const { chapel, loading: chapelLoading } = useChapel(registration?.chapelId || "");
  const { ordinances } = useOrdinances();

  const { exportData, isPending: isExporting } = useExportData();
  const { withdrawConsent, isPending: isWithdrawing } = useWithdrawConsent();
  const { deleteAllData, isPending: isDeleting } = useDeleteAllData();

  const [accessLogs, setAccessLogs] = useState<DataAccessLogWithId[]>([]);

  const loading = registrationLoading || caravanLoading || chapelLoading;

  // Get ordinance names
  const ordinanceMap = useMemo(() => {
    const map = new Map();
    ordinances.forEach((ord) => {
      map.set(ord.id, ord.name);
    });
    return map;
  }, [ordinances]);

  // Load access logs
  useEffect(() => {
    if (!registration?.id) return;

    let cancelled = false;

    dataAccessLogsRepository
      .getByRegistrationId(registration.id)
      .then((logs) => {
        if (!cancelled) {
          setAccessLogs(logs);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Error loading access logs:", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [registration?.id]);

  const formatDate = (timestamp: Timestamp | undefined | null) => {
    if (!timestamp) return "-";
    try {
      const date = timestamp.toDate();
      return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  const handleExport = async () => {
    if (!uuid) return;
    try {
      await exportData(uuid);
      notification.success({
        title: "Sucesso",
        description: "Os seus dados foram exportados com sucesso",
        duration: 4.5,
      });
    } catch (error) {
      notification.error({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao exportar dados",
        duration: 4.5,
      });
    }
  };

  const handleWithdrawConsent = () => {
    if (!uuid) return;

    modal.confirm({
      title: "Retirar Consentimento",
      content:
        "Tem certeza que deseja retirar o seu consentimento? Isto não eliminará os seus dados, mas marcará que o consentimento foi retirado.",
      okText: "Retirar Consentimento",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await withdrawConsent(uuid);
          notification.success({
            title: "Sucesso",
            description: "O consentimento foi retirado com sucesso",
            duration: 4.5,
          });
          // Refresh data
          window.location.reload();
        } catch (error) {
          notification.error({
            title: "Erro",
            description:
              error instanceof Error
                ? error.message
                : "Erro ao retirar consentimento",
            duration: 4.5,
          });
        }
      },
    });
  };

  const handleDeleteAllData = () => {
    if (!uuid) return;

    modal.confirm({
      title: "Eliminar Todos os Dados",
      content:
        "Tem CERTEZA ABSOLUTA que deseja eliminar todos os seus dados? Esta ação não pode ser desfeita e eliminará permanentemente todos os seus dados do sistema.",
      okText: "Sim, Eliminar Tudo",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: () => {
        // Double confirmation
        modal.confirm({
          title: "Confirmação Final",
          content:
            "Esta é a última confirmação. Ao confirmar, todos os seus dados serão eliminados permanentemente e não poderão ser recuperados. Deseja continuar?",
          okText: "Sim, Eliminar Permanentemente",
          okType: "danger",
          cancelText: "Cancelar",
          onOk: async () => {
            try {
              await deleteAllData(uuid);
              notification.success({
                title: "Dados Eliminados",
                description:
                  "Todos os seus dados foram eliminados com sucesso. Será redirecionado em breve.",
                duration: 4.5,
              });
              setTimeout(() => {
                window.location.href = "/";
              }, 2000);
            } catch (error) {
              notification.error({
                title: "Erro",
                description:
                  error instanceof Error
                    ? error.message
                    : "Erro ao eliminar dados",
                duration: 4.5,
              });
            }
          },
        });
      },
    });
  };

  if (!uuid) {
    return (
      <PublicContent>
        <motion.div {...pageAnimation}>
          <Card>
            <Alert
              message="UUID não fornecido"
              description="Por favor, aceda a esta página através do link enviado por WhatsApp."
              type="error"
              showIcon
            />
          </Card>
        </motion.div>
      </PublicContent>
    );
  }

  if (loading) {
    return (
      <PublicContent>
        <div className="flex justify-center items-center min-h-[400px]">
          <Spin size="large" />
        </div>
      </PublicContent>
    );
  }

  if (!registration) {
    return (
      <PublicContent>
        <motion.div {...pageAnimation}>
          <Card>
            <Alert
              message="Registo não encontrado"
              description="Não foi possível encontrar os seus dados. Por favor, verifique o link ou solicite um novo acesso."
              type="error"
              showIcon
            />
          </Card>
        </motion.div>
      </PublicContent>
    );
  }

  return (
    <PublicContent>
      <motion.div {...pageAnimation}>
        <Title level={2}>Os Meus Dados</Title>
        <Paragraph>
          Aqui pode ver todos os seus dados pessoais, exportá-los, retirar o
          consentimento ou eliminar todos os dados.
        </Paragraph>

        <AnimatePresence>
          <Space orientation="vertical" size="large" className="w-full mt-6">
            <motion.div
              key="personal-info"
              {...cardAnimation}
              transition={cardTransition(0)}
            >
              <Card title="Informações Pessoais">
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="Nome Completo">
                    {registration.fullName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Telefone">
                    {registration.phone}
                  </Descriptions.Item>
                  <Descriptions.Item label="Categoria de Idade">
                    {registration.ageCategory === "CHILD"
                      ? "Criança"
                      : registration.ageCategory === "YOUTH"
                        ? "Jovem"
                        : "Adulto"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Sexo">
                    {registration.gender === "M" ? "Masculino" : "Feminino"}
                  </Descriptions.Item>
                  <Descriptions.Item label="É Oficiante">
                    {registration.isOfficiator ? "Sim" : "Não"}
                  </Descriptions.Item>
                  {registration.legalGuardianName && (
                    <>
                      <Descriptions.Item label="Nome do Responsável Legal">
                        {registration.legalGuardianName}
                      </Descriptions.Item>
                      <Descriptions.Item label="Email do Responsável Legal">
                        {registration.legalGuardianEmail || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Telefone do Responsável Legal">
                        {registration.legalGuardianPhone || "-"}
                      </Descriptions.Item>
                    </>
                  )}
                </Descriptions>
              </Card>
            </motion.div>

            {caravan && (
              <motion.div
                key="caravan-info"
                {...cardAnimation}
                transition={cardTransition(0.1)}
              >
                <Card title="Informações da Viagem">
                  <Descriptions column={1} bordered>
                    <Descriptions.Item label="Nome da Viagem">
                      {caravan.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Data de Partida">
                      {caravan.departureAt
                        ? format(caravan.departureAt.toDate(), "dd/MM/yyyy", {
                          locale: ptBR,
                        })
                        : "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Data de Retorno">
                      {caravan.returnAt
                        ? format(caravan.returnAt.toDate(), "dd/MM/yyyy", {
                          locale: ptBR,
                        })
                        : "-"}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </motion.div>
            )}

            {chapel && (
              <motion.div
                key="chapel-info"
                {...cardAnimation}
                transition={cardTransition(0.15)}
              >
                <Card title="Informações da Capela de Partida">
                  <Descriptions column={1} bordered>
                    <Descriptions.Item label="Nome da Capela">
                      {chapel.name}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </motion.div>
            )}

            {registration.ordinances && registration.ordinances.length > 0 && (
              <motion.div
                key="ordinances"
                {...cardAnimation}
                transition={cardTransition(0.2)}
              >
                <Card title="Ordenanças">
                  <Descriptions column={1} bordered>
                    {registration.ordinances.map((ord, index) => (
                      <Descriptions.Item
                        key={index}
                        label={`Ordenança ${index + 1}`}
                      >
                        {ordinanceMap.get(ord.ordinanceId) || "Desconhecida"} -{" "}
                        {ord.slot}
                        {ord.isPersonal ? " (Pessoal)" : ""}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                </Card>
              </motion.div>
            )}

            <motion.div
              key="payment-status"
              {...cardAnimation}
              transition={cardTransition(0.25)}
            >
              <Card title="Estado de Pagamento e Participação">
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="Estado de Pagamento">
                    {registration.paymentStatus === "PENDING"
                      ? "Pendente"
                      : registration.paymentStatus === "PAID"
                        ? "Pago"
                        : registration.paymentStatus === "FREE"
                          ? "Gratuito"
                          : "Cancelado"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Estado de Participação">
                    {registration.participationStatus === "ACTIVE"
                      ? "Ativo"
                      : registration.participationStatus === "CANCELLED"
                        ? "Cancelado"
                        : "Lista de Espera"}
                  </Descriptions.Item>
                  <Descriptions.Item label="É Primeira Vez como Convertido">
                    {registration.isFirstTimeConvert ? "Sim" : "Não"}
                  </Descriptions.Item>
                  {registration.paymentConfirmedAt && (
                    <Descriptions.Item label="Pagamento Confirmado em">
                      {formatDate(registration.paymentConfirmedAt)}
                    </Descriptions.Item>
                  )}
                  {registration.cancelledAt && (
                    <Descriptions.Item label="Cancelado em">
                      {formatDate(registration.cancelledAt)}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            </motion.div>

            <motion.div
              key="privacy-policy"
              {...cardAnimation}
              transition={cardTransition(0.3)}
            >
              <Card title="Política de Privacidade">
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="Política Aceite">
                    {registration.privacyPolicyAccepted ? "Sim" : "Não"}
                  </Descriptions.Item>
                  {registration.privacyPolicyAcceptedAt && (
                    <Descriptions.Item label="Aceite em">
                      {formatDate(registration.privacyPolicyAcceptedAt)}
                    </Descriptions.Item>
                  )}
                  {registration.consentWithdrawnAt && (
                    <Descriptions.Item label="Consentimento Retirado em">
                      {formatDate(registration.consentWithdrawnAt)}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            </motion.div>

            {accessLogs.length > 0 && (
              <motion.div
                key="access-logs"
                {...cardAnimation}
                transition={cardTransition(0.35)}
              >
                <Card title="Histórico de Acessos">
                  <Descriptions column={1} bordered>
                    {accessLogs.map((log, index) => (
                      <Descriptions.Item key={index} label={`Acesso ${index + 1}`}>
                        {log.action === "VIEW"
                          ? "Visualização"
                          : log.action === "EXPORT"
                            ? "Exportação"
                            : log.action === "DELETE"
                              ? "Eliminação"
                              : "Retirada de Consentimento"}{" "}
                        - {formatDate(log.accessedAt)}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                </Card>
              </motion.div>
            )}

            <motion.div
              key="actions"
              {...cardAnimation}
              transition={cardTransition(0.4)}
            >
              <Card title="Ações">
                <Space orientation="vertical" size="middle" className="w-full">
                  <Button
                    type="primary"
                    onClick={handleExport}
                    loading={isExporting}
                    block
                    size="large"
                  >
                    Exportar os Meus Dados (JSON)
                  </Button>

                  <Button
                    onClick={handleWithdrawConsent}
                    loading={isWithdrawing}
                    block
                    size="large"
                    danger
                  >
                    Retirar Consentimento
                  </Button>

                  <Button
                    onClick={handleDeleteAllData}
                    loading={isDeleting}
                    block
                    size="large"
                    danger
                  >
                    Apagar Todos os Meus Dados
                  </Button>
                </Space>
              </Card>
            </motion.div>
          </Space>
        </AnimatePresence>
      </motion.div>
    </PublicContent>
  );
}

export default function MyDataPage() {
  return (
    <Suspense
      fallback={
        <PublicContent>
          <div className="flex justify-center items-center min-h-[400px]">
            <Spin size="large" />
          </div>
        </PublicContent>
      }
    >
      <MyDataContent />
    </Suspense>
  );
}
