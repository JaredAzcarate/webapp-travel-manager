"use client";

import { PublicContent } from "@/common/components/PublicContent";
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
        {activeCaravan ? (
          <motion.div
            key={`caravan-${activeCaravan.id}`}
            initial={sectionAnimation.initial}
            animate={sectionAnimation.animate}
            exit={sectionAnimation.exit}
            transition={sectionTransition(0.1)}
            className="p-4 rounded-2xl border border-gray-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              {/* Caravan icon */}
              <div className="flex items-center justify-center bg-primary/10 p-1 w-10 h-10 rounded-md">
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M19.75 15v5.75h-5.409v-3.637A2.343 2.343 0 0 0 12 14.772a2.343 2.343 0 0 0-2.341 2.341v3.637H4.25V15h-.056l6.223-3.007c.208-.1.358-.29.407-.516L12 6.045l1.176 5.432a.748.748 0 0 0 .407.516L19.806 15h-.056zm-5.185-4.198l-1.832-8.461c-.171-.788-1.295-.788-1.466 0l-1.832 8.461-7.761 3.75a.75.75 0 1 0 .652 1.351l.424-.205V21.5c0 .414.336.75.75.75h17a.75.75 0 0 0 .75-.75v-5.802l.424.205a.75.75 0 1 0 .652-1.351l-7.761-3.75z"></path>
                </svg>
              </div>

              {/* Form status */}
              <div className="flex flex-col">
                <Title level={5}>{activeCaravan.name}</Title>

                {isFormOpen ? (
                  <Badge
                    color="green"
                    text="Aberto para inscrições"
                  />
                ) : (
                  <Badge
                    color="red"
                    text="Fechado para inscrições"
                  />
                )}
              </div>
            </div>

            {isFormOpen && (
              <div>
                <Button
                  type="primary"
                  size="middle"
                  block
                  onClick={() =>
                    router.push(`/registration/${activeCaravan.id}`)
                  }
                >
                  Abrir formulário de inscrição
                </Button>
              </div>
            )}

            {!isFormOpen && activeCaravan.formOpenAt && (
              <Alert
                showIcon={true}
                description={`O formulário de inscrição fechou no dia ${dayjs(activeCaravan.formCloseAt?.toDate()).format("DD/MM/YYYY")}`}
                type="warning"
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="empty-state"
            initial={sectionAnimation.initial}
            animate={sectionAnimation.animate}
            exit={sectionAnimation.exit}
            transition={sectionTransition(0.1)}
            className="p-8 rounded-2xl border border-gray-200 bg-white flex items-center justify-center gap-4"
          >
            <Empty
              description="Nenhuma caravana ativa"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </PublicContent>
  );
}
