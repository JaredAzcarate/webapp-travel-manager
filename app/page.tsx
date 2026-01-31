"use client";

import { PublicContent } from "@/common/components/PublicContent";
import { toDate } from "@/common/utils/timestamp.utils";
import { useActiveCaravans } from "@/features/caravans/hooks/caravans.hooks";
import { Alert, Badge, Button, Empty, Spin, Typography } from "antd";
import dayjs from "dayjs";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

const { Title } = Typography;

const sectionAnimation = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

function sectionTransition(delay = 0) {
  return {
    duration: 0.3,
    delay,
    ease: [0.4, 0, 0.2, 1] as const,
  };
}

function CaravanCard({
  caravan,
  isFormOpen,
}: {
  caravan: { id: string; name: string; formOpenAt?: unknown; formCloseAt?: unknown };
  isFormOpen: boolean;
}) {
  const router = useRouter();
  const now = new Date();
  const formOpenAt = toDate(caravan.formOpenAt as string);
  const formCloseAt = toDate(caravan.formCloseAt as string);
  const isFormNotYetOpen = formOpenAt && now < formOpenAt;
  const isFormClosed = formCloseAt && now > formCloseAt;
  const message = isFormNotYetOpen
    ? `O formulário abrirá no dia ${dayjs(formOpenAt).format("DD/MM/YYYY")}`
    : isFormClosed
      ? `O formulário de inscrição fechou no dia ${dayjs(formCloseAt).format("DD/MM/YYYY")}`
      : null;

  const cardTransition = { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const };

  return (
    <motion.div
      key={`caravan-${caravan.id}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={cardTransition}
      className={`p-4 rounded-2xl border border-gray-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 ${isFormOpen ? "opacity-100" : "opacity-50"}`}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center bg-primary/10 p-1 w-10 h-10 rounded-md">
          <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.75 15v5.75h-5.409v-3.637A2.343 2.343 0 0 0 12 14.772a2.343 2.343 0 0 0-2.341 2.341v3.637H4.25V15h-.056l6.223-3.007c.208-.1.358-.29.407-.516L12 6.045l1.176 5.432a.748.748 0 0 0 .407.516L19.806 15h-.056zm-5.185-4.198l-1.832-8.461c-.171-.788-1.295-.788-1.466 0l-1.832 8.461-7.761 3.75a.75.75 0 1 0 .652 1.351l.424-.205V21.5c0 .414.336.75.75.75h17a.75.75 0 0 0 .75-.75v-5.802l.424.205a.75.75 0 1 0 .652-1.351l-7.761-3.75z" />
          </svg>
        </div>
        <div className="flex flex-col">
          <Title level={5}>{caravan.name}</Title>
          {isFormOpen ? (
            <Badge color="green" text="Aberto para inscrições" />
          ) : (
            <Badge color="red" text="Fechado para inscrições" />
          )}
        </div>
      </div>
      {isFormOpen && (
        <div>
          <Button
            type="primary"
            size="middle"
            block
            onClick={() => router.push(`/registration/${caravan.id}`)}
          >
            Realizar inscrição
          </Button>
        </div>
      )}
      {!isFormOpen && caravan.formOpenAt && message ? (
        <Alert showIcon description={message} type="warning" />
      ) : null}
    </motion.div>
  );
}

export default function HomePage() {
  const { caravans, loading } = useActiveCaravans();

  const caravansWithStatus = useMemo(() => {
    const now = new Date();
    return caravans.map((caravan) => {
      const formOpenAt = toDate(caravan.formOpenAt);
      const formCloseAt = toDate(caravan.formCloseAt);
      const isFormOpen =
        !!formOpenAt &&
        !!formCloseAt &&
        now >= formOpenAt &&
        now <= formCloseAt;
      return { caravan, isFormOpen };
    });
  }, [caravans]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <PublicContent>
      <AnimatePresence>
        <motion.div
          key="page-title"
          initial={sectionAnimation.initial}
          animate={sectionAnimation.animate}
          exit={sectionAnimation.exit}
          transition={sectionTransition(0)}
        >
          <Title level={3} className="text-2xl sm:text-3xl md:text-4xl">
            Lista de caravanas
          </Title>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {caravansWithStatus.length > 0 ? (
          <div className="space-y-4">
            {caravansWithStatus.map(({ caravan, isFormOpen }) => (
              <CaravanCard
                key={caravan.id}
                caravan={caravan}
                isFormOpen={isFormOpen}
              />
            ))}
          </div>
        ) : (
          <motion.div
            key="empty-state"
            initial={sectionAnimation.initial}
            animate={sectionAnimation.animate}
            exit={sectionAnimation.exit}
            transition={sectionTransition(0.1)}
            className="p-8 rounded-2xl border border-gray-200 bg-white flex items-center justify-center gap-4"
          >
            <Empty description="Nenhuma caravana programada" />
          </motion.div>
        )}
      </AnimatePresence>
    </PublicContent>
  );
}
