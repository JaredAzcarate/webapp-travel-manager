"use client";

import { CardRadioGroup } from "@/common/components/CardRadioGroup";
import { OrdinancesListField } from "@/common/components/OrdinancesListField";
import { PrivacyPolicyModal } from "@/common/components/PrivacyPolicyModal";
import { OrdinanceFormValue } from "@/common/utils/ordinances.utils";
import { useBus } from "@/features/buses/hooks/buses.hooks";
import { useBusStops } from "@/features/buses/hooks/busStops.hooks";
import {
  useActiveCaravans,
  useCaravan,
} from "@/features/caravans/hooks/caravans.hooks";
import { useChapels } from "@/features/chapels/hooks/chapels.hooks";
import { useOrdinances } from "@/features/ordinances/hooks/ordinances.hooks";
import {
  useCountActiveByBus,
  useCreateRegistration,
  useUpdateRegistration,
} from "@/features/registrations/hooks/registrations.hooks";
import {
  AgeCategory,
  CreateRegistrationInput,
  RegistrationWithId,
  UpdateRegistrationInput,
} from "@/features/registrations/models/registrations.model";
import {
  Alert,
  App,
  Button,
  Checkbox,
  Divider,
  Form,
  FormInstance,
  Input,
  Radio,
  Select,
  Typography
} from "antd";
import { Timestamp } from "firebase/firestore";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const { Paragraph, Title } = Typography;

const sectionAnimation = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

function sectionTransition(delay = 0) {
  return { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const, delay };
}

interface FormValues {
  caravanId: string;
  chapelId: string;
  busId?: string;
  phone?: string;
  fullName: string;
  ageCategory: AgeCategory;
  gender?: "M" | "F";
  isOfficiator?: boolean;
  legalGuardianName?: string;
  legalGuardianEmail?: string;
  legalGuardianPhone?: string;
  ordinances: OrdinanceFormValue[];
  skipsOrdinances?: boolean;
  isFirstTimeConvert: boolean;
  hasLessThanOneYearAsMember: boolean;
  privacyPolicyAccepted: boolean;
}

interface RegistrationFormProps {
  mode: "create" | "edit";
  registrationId?: string;
  initialRegistrationData?: RegistrationWithId;
  caravanId?: string;
  onSuccess?: () => void;
}

export const RegistrationForm = ({
  mode,
  registrationId,
  initialRegistrationData,
  caravanId: propCaravanId,
  onSuccess,
}: RegistrationFormProps) => {
  const { notification } = App.useApp();
  const router = useRouter();
  const [form] = Form.useForm<FormValues>();
  const [privacyPolicyModalOpen, setPrivacyPolicyModalOpen] = useState(false);
  const hasShownSuccessRef = useRef(false);
  const hasShownErrorRef = useRef(false);
  const prevAgeCategoryRef = useRef<AgeCategory | undefined>(undefined);
  const prevSkipsOrdinancesRef = useRef<boolean | undefined>(undefined);

  const {
    createRegistrationAsync,
    isPending: isCreating,
    isSuccess: created,
    error: createError,
  } = useCreateRegistration();

  const {
    updateRegistration,
    isPending: isUpdating,
    isSuccess: updated,
    error: updateError,
  } = useUpdateRegistration();

  const { caravans: activeCaravans, loading: loadingCaravans } =
    useActiveCaravans();
  const { chapels, loading: loadingChapels } = useChapels();
  const { busStops } = useBusStops();
  const { ordinances } = useOrdinances();

  const selectedCaravanId = Form.useWatch("caravanId", form);
  const selectedChapelId = Form.useWatch("chapelId", form);
  const ordinancesList = Form.useWatch("ordinances", form) || [];
  const ageCategory = Form.useWatch("ageCategory", form);
  const gender = Form.useWatch("gender", form);
  const isFirstTimeConvert = Form.useWatch("isFirstTimeConvert", form);
  const hasLessThanOneYearAsMember = Form.useWatch(
    "hasLessThanOneYearAsMember",
    form
  );
  const skipsOrdinances = Form.useWatch("skipsOrdinances", form);

  const { caravan: selectedCaravan } = useCaravan(selectedCaravanId || "");

  const assignedBusId = useMemo(() => {
    if (!selectedChapelId || !selectedCaravan || !busStops.length) return null;

    const stopsForChapel = busStops.filter(
      (stop) => stop.chapelId === selectedChapelId
    );

    if (stopsForChapel.length === 0) return null;

    const validStops = stopsForChapel
      .filter((stop) => selectedCaravan.busIds.includes(stop.busId))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (validStops.length === 0) return null;

    return validStops[0].busId;
  }, [selectedChapelId, selectedCaravan, busStops]);

  const { bus: assignedBus } = useBus(assignedBusId || "");
  const { count: occupiedCount } = useCountActiveByBus(
    selectedCaravanId || "",
    assignedBusId || ""
  );

  const capacityInfo = useMemo(() => {
    if (!assignedBus || !selectedCaravanId || !assignedBusId) return null;
    const available = assignedBus.capacity - occupiedCount;
    const isFull = occupiedCount >= assignedBus.capacity;
    return {
      occupied: occupiedCount,
      capacity: assignedBus.capacity,
      available,
      isFull,
      busName: assignedBus.name,
    };
  }, [assignedBus, occupiedCount, selectedCaravanId, assignedBusId]);

  const busAssignmentMessage = useMemo(() => {
    if (!selectedChapelId) return null;

    if (!assignedBusId) {
      return {
        type: "warning" as const,
        message: "Atenção: Nesta viagem não foi programada uma paragem na sua unidade, por favor selecione outra unidade.",
        available: false,
      };
    }

    if (capacityInfo?.isFull) {
      return {
        type: "warning" as const,
        message:
          "O autocarro que passará pela sua unidade não tem mais vagas. No entanto, o seu nome entrará na lista de espera",
        available: true,
      };
    }

    if (capacityInfo && assignedBus) {
      return {
        type: "info" as const,
        message: `Importante: Ainda há ${capacityInfo.available} vagas disponíveis no autocarro.`,
        available: true,
      };
    }

    return null;
  }, [selectedChapelId, assignedBusId, capacityInfo, assignedBus]);

  const isBusAvailable = useMemo(() => {
    // If no chapel is selected, form should be disabled
    if (!selectedChapelId) return false;

    // Use busAssignmentMessage.available if it exists
    if (busAssignmentMessage) {
      return busAssignmentMessage.available ?? false;
    }

    // If there's no assigned bus, bus is not available
    if (!assignedBusId) return false;

    // If capacity info is not loaded yet but bus is assigned, assume available
    if (!capacityInfo) return true;

    // Bus is available if there's capacity or if it's full but still allows waitlist
    return true;
  }, [selectedChapelId, assignedBusId, capacityInfo, busAssignmentMessage]);

  const prevHasLessThanOneYearAsMember = useRef(hasLessThanOneYearAsMember);
  useEffect(() => {
    if (
      prevHasLessThanOneYearAsMember.current === true &&
      hasLessThanOneYearAsMember === false
    ) {
      form.setFieldsValue({ isFirstTimeConvert: false });
    }
    prevHasLessThanOneYearAsMember.current = hasLessThanOneYearAsMember;
  }, [hasLessThanOneYearAsMember, form]);

  const prevChapelIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (
      prevChapelIdRef.current !== undefined &&
      selectedChapelId !== undefined &&
      prevChapelIdRef.current !== selectedChapelId
    ) {
      const caravanId = form.getFieldValue("caravanId");
      // Defer form updates to next tick so the chapel Select dropdown can close first
      const timer = setTimeout(() => {
        form.setFieldsValue({
          caravanId,
          chapelId: selectedChapelId,
          ageCategory: undefined,
          isOfficiator: false,
          isFirstTimeConvert: false,
          hasLessThanOneYearAsMember: false,
          skipsOrdinances: false,
          privacyPolicyAccepted: false,
          ordinances: [],
          fullName: undefined,
          phone: undefined,
          gender: undefined,
          legalGuardianName: undefined,
          legalGuardianEmail: undefined,
          legalGuardianPhone: undefined,
        });
      }, 0);
      prevChapelIdRef.current = selectedChapelId;
      return () => clearTimeout(timer);
    }
    prevChapelIdRef.current = selectedChapelId;
  }, [selectedChapelId, form]);

  // Initialize form values
  useEffect(() => {
    if (mode === "edit" && initialRegistrationData) {
      const existingOrdinances =
        initialRegistrationData.ordinances &&
          Array.isArray(initialRegistrationData.ordinances)
          ? initialRegistrationData.ordinances
          : [];

      const ordinancesData = existingOrdinances
        .filter((ord) => ord.ordinanceId && ord.slot)
        .map((ord) => ({
          ordinanceId: ord.ordinanceId!,
          slot: ord.slot!,
          isPersonal: ord.isPersonal ?? false,
        }));

      // Migrate ageCategory if needed
      let ageCategoryValue: AgeCategory = initialRegistrationData.ageCategory;
      const registrationData = initialRegistrationData as RegistrationWithId & { isAdult?: boolean };
      if (!ageCategoryValue && registrationData.isAdult !== undefined) {
        ageCategoryValue = registrationData.isAdult ? "ADULT" : "YOUTH";
      }

      form.setFieldsValue({
        caravanId: initialRegistrationData.caravanId,
        chapelId: initialRegistrationData.chapelId,
        busId: initialRegistrationData.busId,
        phone: initialRegistrationData.phone,
        fullName: initialRegistrationData.fullName,
        ageCategory: ageCategoryValue,
        gender: initialRegistrationData.gender,
        isOfficiator: initialRegistrationData.isOfficiator,
        legalGuardianName: initialRegistrationData.legalGuardianName,
        legalGuardianEmail: initialRegistrationData.legalGuardianEmail,
        legalGuardianPhone: initialRegistrationData.legalGuardianPhone,
        ordinances: ordinancesData,
        skipsOrdinances:
          initialRegistrationData.skipsOrdinances ??
          (ordinancesData.length === 0),
        isFirstTimeConvert: initialRegistrationData.isFirstTimeConvert,
        hasLessThanOneYearAsMember: false,
        privacyPolicyAccepted: initialRegistrationData.privacyPolicyAccepted ?? false,
      });
    }
  }, [mode, initialRegistrationData, form]);

  useEffect(() => {
    if (mode === "create" && propCaravanId) {
      form.setFieldsValue({
        caravanId: propCaravanId,
        ordinances: [],
        skipsOrdinances: false,
      });
    }
  }, [mode, propCaravanId, form]);

  useEffect(() => {
    if (mode === "create" && assignedBusId && selectedChapelId) {
      form.setFieldsValue({ busId: assignedBusId });
    }
  }, [assignedBusId, selectedChapelId, form, mode]);

  // Clear all fields after ageCategory when it changes
  useEffect(() => {
    if (prevAgeCategoryRef.current !== undefined && ageCategory !== undefined && prevAgeCategoryRef.current !== ageCategory) {
      form.setFieldsValue({
        hasLessThanOneYearAsMember: false,
        isFirstTimeConvert: false,
        skipsOrdinances: false,
        fullName: undefined,
        phone: undefined,
        gender: undefined,
        legalGuardianName: undefined,
        legalGuardianEmail: undefined,
        legalGuardianPhone: undefined,
        isOfficiator: false,
        ordinances: [],
        privacyPolicyAccepted: false,
      });
    }
    prevAgeCategoryRef.current = ageCategory;
    prevSkipsOrdinancesRef.current = undefined;
  }, [ageCategory, form]);

  // When "Não vou fazer ordenanças" is checked, clear selected ordinances
  useEffect(() => {
    if (
      prevSkipsOrdinancesRef.current === false &&
      skipsOrdinances === true
    ) {
      form.setFieldsValue({ ordinances: [] });
    }
    prevSkipsOrdinancesRef.current = skipsOrdinances;
  }, [skipsOrdinances, form]);

  useEffect(() => {
    if (mode === "create" && created && !hasShownSuccessRef.current) {
      hasShownSuccessRef.current = true;
      notification.success({
        title: "Inscrição realizada com sucesso!",
        description: "A sua inscrição foi registrada. Será redirecionado para a página de confirmação.",
        duration: 3,
      });

      // Add a small delay before redirecting to allow the notification to be visible
      const redirectTimer = setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          // Reset form only if onSuccess is not provided
          form.resetFields();
          if (propCaravanId) {
            form.setFieldsValue({
              caravanId: propCaravanId,
              ordinances: [],
            });
          }
        }
      }, 500);

      return () => clearTimeout(redirectTimer);
    }
    if (!created && !isCreating) {
      hasShownSuccessRef.current = false;
    }
  }, [mode, created, isCreating, form, notification, onSuccess, propCaravanId]);

  useEffect(() => {
    if (mode === "edit" && updated && !hasShownSuccessRef.current) {
      hasShownSuccessRef.current = true;
      notification.success({
        title: "Sucesso",
        description: "A inscrição foi atualizada com sucesso",
      });
      if (onSuccess) {
        onSuccess();
      }
    }
    if (!updated && !isUpdating) {
      hasShownSuccessRef.current = false;
    }
  }, [mode, updated, isUpdating, notification, onSuccess]);

  useEffect(() => {
    if (mode === "create" && createError && !hasShownErrorRef.current) {
      hasShownErrorRef.current = true;
      const errorMessage =
        createError instanceof Error
          ? createError.message
          : "Erro desconhecido";
      notification.error({
        title: "Erro",
        description: `Não foi possível criar a inscrição: ${errorMessage}`,
      });
    }
    if (!createError && !isCreating) {
      hasShownErrorRef.current = false;
    }
  }, [mode, createError, isCreating, notification]);

  useEffect(() => {
    if (mode === "edit" && updateError && !hasShownErrorRef.current) {
      hasShownErrorRef.current = true;
      const errorMessage =
        updateError instanceof Error
          ? updateError.message
          : "Erro desconhecido";
      notification.error({
        title: "Erro",
        description: `Não foi possível atualizar a inscrição: ${errorMessage}`,
      });
    }
    if (!updateError && !isUpdating) {
      hasShownErrorRef.current = false;
    }
  }, [mode, updateError, isUpdating, notification]);

  const handleSubmit = async (values: FormValues) => {
    let finalBusId = values.busId;

    if (mode === "create" && !finalBusId && selectedChapelId && selectedCaravanId) {
      const caravan = activeCaravans.find((c) => c.id === selectedCaravanId);
      if (caravan && busStops.length > 0) {
        const stopsForChapel = busStops.filter(
          (stop) => stop.chapelId === selectedChapelId
        );

        if (stopsForChapel.length > 0) {
          const validStops = stopsForChapel
            .filter((stop) => caravan.busIds.includes(stop.busId))
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          if (validStops.length > 0) {
            finalBusId = validStops[0].busId;
            values.busId = finalBusId;
            form.setFieldsValue({ busId: finalBusId });
          }
        }
      }
    }

    if (mode === "create" && !finalBusId && assignedBusId) {
      finalBusId = assignedBusId;
      values.busId = assignedBusId;
      form.setFieldsValue({ busId: assignedBusId });
    }

    if (mode === "create" && !finalBusId) {
      notification.error({
        title: "Erro",
        description:
          "Não foi possível atribuir um autocarro. Por favor, verifique se há um autocarro disponível para a sua capela.",
      });
      return;
    }

    if (mode === "create") {
      const paymentStatus: "PENDING" | "FREE" = values.isFirstTimeConvert
        ? "FREE"
        : "PENDING";

      // For CHILD and YOUTH, use legalGuardianPhone as the phone identifier
      // For ADULT, use phone
      const phoneValue = (values.ageCategory === "CHILD" || values.ageCategory === "YOUTH")
        ? values.legalGuardianPhone || ""
        : values.phone || "";

      const input: CreateRegistrationInput = {
        caravanId: values.caravanId || selectedCaravanId || propCaravanId || "",
        chapelId: values.chapelId || selectedChapelId || "",
        busId: finalBusId || values.busId || "",
        phone: phoneValue,
        fullName: values.fullName,
        ageCategory: values.ageCategory,
        gender: values.gender || "M", // Default to "M" for CHILD if not provided
        isOfficiator: values.isOfficiator ?? false,
        ...(values.legalGuardianName && {
          legalGuardianName: values.legalGuardianName,
        }),
        ...(values.legalGuardianEmail && {
          legalGuardianEmail: values.legalGuardianEmail,
        }),
        ...(values.legalGuardianPhone && {
          legalGuardianPhone: values.legalGuardianPhone,
        }),
        ordinances:
          values.skipsOrdinances === true
            ? []
            : (values.ordinances || [])
              .filter((ord) => ord.ordinanceId && ord.slot)
              .map((ord) => ({
                ordinanceId: ord.ordinanceId!,
                slot: ord.slot!,
                isPersonal: ord.isPersonal ?? false,
              })),
        skipsOrdinances: values.skipsOrdinances ?? false,
        isFirstTimeConvert: values.isFirstTimeConvert ?? false,
        paymentStatus,
        participationStatus: "ACTIVE",
        privacyPolicyAccepted: values.privacyPolicyAccepted,
        privacyPolicyAcceptedAt: values.privacyPolicyAccepted
          ? Timestamp.now()
          : undefined,
      };

      try {
        await createRegistrationAsync(input);

        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        // Error is already handled by the useEffect that watches createError
        // No need to show notification here as it will be shown by the useEffect
        console.error("Error creating registration:", error);
      }
    } else if (mode === "edit" && registrationId) {
      // For CHILD and YOUTH, use legalGuardianPhone as the phone identifier
      // For ADULT, use phone
      const phoneValue = (values.ageCategory === "CHILD" || values.ageCategory === "YOUTH")
        ? values.legalGuardianPhone || ""
        : values.phone || "";

      const input: UpdateRegistrationInput = {
        caravanId: values.caravanId,
        chapelId: values.chapelId,
        busId: values.busId,
        phone: phoneValue,
        fullName: values.fullName,
        ageCategory: values.ageCategory,
        gender: values.gender || "M", // Default to "M" for CHILD if not provided
        isOfficiator: values.isOfficiator ?? false,
        ...(values.legalGuardianName && {
          legalGuardianName: values.legalGuardianName,
        }),
        ...(values.legalGuardianEmail && {
          legalGuardianEmail: values.legalGuardianEmail,
        }),
        ...(values.legalGuardianPhone && {
          legalGuardianPhone: values.legalGuardianPhone,
        }),
        ordinances:
          values.skipsOrdinances === true
            ? []
            : (values.ordinances || [])
              .filter((ord) => ord.ordinanceId && ord.slot)
              .map((ord) => ({
                ordinanceId: ord.ordinanceId!,
                slot: ord.slot!,
                isPersonal: ord.isPersonal ?? false,
              })),
        skipsOrdinances: values.skipsOrdinances ?? false,
        isFirstTimeConvert: values.isFirstTimeConvert ?? false,
        privacyPolicyAccepted: values.privacyPolicyAccepted,
      };
      updateRegistration(registrationId, input);
    }
  };

  const isPending = mode === "create" ? isCreating : isUpdating;

  // Determine which sections to show based on age category
  const shouldShowOrdinancesStep = ageCategory !== "CHILD";

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      validateTrigger="onSubmit"
      scrollToFirstError={{ behavior: "smooth", block: "center" }}
      initialValues={{
        ageCategory: undefined,
        isOfficiator: false,
        isFirstTimeConvert: false,
        hasLessThanOneYearAsMember: false,
        privacyPolicyAccepted: false,
        ordinances: [],
      }}
      className="flex flex-col gap-8 p-10"
    >
      {/* Section 1: Initial Information */}
      <motion.div
        className="bg-white p-4 rounded-2xl flex flex-col gap-4"
        initial={sectionAnimation.initial}
        animate={sectionAnimation.animate}
        transition={sectionTransition(0)}
      >
        <Title level={4} className="mb-4">
          Informações Iniciais
        </Title>
        {mode === "create" && propCaravanId && (
          <Form.Item
            name="caravanId"
            label="viagem"
            rules={[
              {
                required: true,
                message: "Por favor, selecione uma viagem",
              },
            ]}
            hidden
          >
            <Input />
          </Form.Item>
        )}

        {mode === "edit" && (
          <Form.Item
            name="caravanId"
            label="viagem"
            rules={[
              {
                required: true,
                message: "Por favor, selecione uma viagem",
              },
            ]}
          >
            <Select
              placeholder="Selecione uma viagem"
              loading={loadingCaravans}
              disabled={!isBusAvailable}
              getPopupContainer={(trigger) => trigger.parentElement || document.body}
              options={activeCaravans.map((caravan) => ({
                label: caravan.name,
                value: caravan.id,
              }))}
            />
          </Form.Item>
        )}

        <Form.Item
          name="chapelId"
          label="Qual é a unidade do participante?"
          rules={[
            { required: true, message: "Por favor, selecione uma capela" },
          ]}
        >
          <Select
            placeholder="Selecione uma capela"
            loading={loadingChapels}
            getPopupContainer={(trigger) => trigger.parentElement || document.body}
            options={chapels.map((chapel) => ({
              label: chapel.name,
              value: chapel.id,
            }))}
          />
        </Form.Item>

        <AnimatePresence>
          {busAssignmentMessage && (
            <motion.div
              key={`bus-assignment-alert-${selectedChapelId}-${assignedBusId || 'no-bus'}`}
              initial={sectionAnimation.initial}
              animate={sectionAnimation.animate}
              exit={sectionAnimation.exit}
              transition={sectionTransition(0)}
            >
              <Alert
                title={busAssignmentMessage.message}
                type={busAssignmentMessage.type}
                showIcon
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={
            !isBusAvailable
              ? "opacity-50 transition-all pointer-events-none flex flex-col gap-4"
              : "flex flex-col gap-4"
          }
        >
          {mode === "create" && (
            <Form.Item name="busId" hidden>
              <Input />
            </Form.Item>
          )}

          <Form.Item
            name="ageCategory"
            label="Qual é a idade do participante?"
            rules={[
              {
                required: true,
                message: "Por favor, selecione a categoria de idade",
              },
            ]}
          >
            <CardRadioGroup
              options={[
                { value: "CHILD", tag: "1-10 anos", primary: "Criança" },
                { value: "YOUTH", tag: "11-17 anos", primary: "Jovem" },
                { value: "ADULT", tag: "+18 anos", primary: "Adulto" },
              ]}
              disabled={!isBusAvailable}
            />
          </Form.Item>

          <AnimatePresence>
            {(ageCategory === "YOUTH" || ageCategory === "ADULT") && (
              <motion.div
                key="youth-adult-switches"
                initial={sectionAnimation.initial}
                animate={sectionAnimation.animate}
                exit={sectionAnimation.exit}
                transition={sectionTransition(0)}
                className="flex flex-col gap-4"
              >
                <Form.Item
                  name="hasLessThanOneYearAsMember"
                  valuePropName="checked"
                >
                  <Checkbox disabled={!isBusAvailable}>O participante tem menos de 1 ano como membro</Checkbox>
                </Form.Item>
                {hasLessThanOneYearAsMember && (
                  <motion.div
                    key="is-first-time-convert"
                    initial={sectionAnimation.initial}
                    animate={sectionAnimation.animate}
                    exit={sectionAnimation.exit}
                    transition={sectionTransition(0)}
                    className="p-4 rounded-2xl bg-white border border-gray-200 flex flex-col"
                  >
                    <div className="flex flex-col gap-2">
                      <Title level={5}>É primeira vez que vai fazer uma ordenança no templo?</Title>
                      <Paragraph>A estaca Porto Norte oferece uma viagem gratuita para <strong>membros recem conversos que fazem a sua primeira ordenança no templo.</strong> Por favor, marque o checkbox se esse for o caso.</Paragraph>
                    </div>

                    <Form.Item
                      name="isFirstTimeConvert"
                      valuePropName="checked"
                    >
                      <Checkbox disabled={!isBusAvailable}>Confirmo que é a minha primeira vez que vou fazer uma ordenança no templo</Checkbox>
                    </Form.Item>

                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Section 2: Personal Information */}
      <motion.div
        className={`p-4 bg-white rounded-2xl flex flex-col gap-4 transition-all
          ${!isBusAvailable
            ? "opacity-30 pointer-events-none"
            : "opacity-100"
          }`}
        initial={sectionAnimation.initial}
        animate={sectionAnimation.animate}
        transition={sectionTransition(0.06)}
      >
        <Title level={4} className="mb-4">
          Dados Pessoais
        </Title>
        <div className="flex flex-col md:flex-row gap-4">
          <Form.Item
            name="fullName"
            label="Nome Completo do participante"
            rules={[
              {
                required: true,
                message: "Por favor, insira o nome completo",
              },
            ]}
            className="flex-1"
          >
            <Input placeholder="Ex: João Silva" disabled={!isBusAvailable} />
          </Form.Item>

          <AnimatePresence>
            {ageCategory === "ADULT" && (
              <motion.div
                key="adult-phone"
                initial={sectionAnimation.initial}
                animate={sectionAnimation.animate}
                exit={sectionAnimation.exit}
                transition={sectionTransition(0)}
                className="flex-1"
              >
                <Form.Item
                  name="phone"
                  label="Número de Telefone do participante"
                  rules={[
                    {
                      required: true,
                      message: "Por favor, insira o número de telefone",
                    },
                    {
                      pattern: /^\+?[1-9]\d{1,14}$/,
                      message: "Por favor, insira um número de telefone válido",
                    },
                  ]}
                >
                  <Input
                    placeholder="Ex: +351912345678"
                    disabled={!isBusAvailable}
                    maxLength={9}
                    type="tel"
                  />
                </Form.Item>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {ageCategory !== "CHILD" && (
            <motion.div
              key="gender-field"
              initial={sectionAnimation.initial}
              animate={sectionAnimation.animate}
              exit={sectionAnimation.exit}
              transition={sectionTransition(0)}
            >
              <Form.Item
                name="gender"
                label="Sexo"
                rules={[{ required: true, message: "Por favor, selecione o sexo" }]}
              >
                <Radio.Group disabled={!isBusAvailable}>
                  <Radio value="M">Masculino</Radio>
                  <Radio value="F">Feminino</Radio>
                </Radio.Group>
              </Form.Item>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(ageCategory === "CHILD" || ageCategory === "YOUTH") && (
            <>
              <motion.div
                key="legal-guardian"
                initial={sectionAnimation.initial}
                animate={sectionAnimation.animate}
                exit={sectionAnimation.exit}
                transition={sectionTransition(0)}
                className="flex flex-col gap-4 border-t border-gray-200 pt-4"
              >
                <div className="flex flex-col ">
                  <Title level={5}>Responsável Legal do Participante</Title>
                  <Paragraph>Todos os participantes menores de 18 anos devem ter um responsável legal. Alem disso, o responsável legal deve assinar o formulário de autorização médica e permissão dos pais/responsáveis.</Paragraph>
                </div>
                <Form.Item
                  name="legalGuardianName"
                  label="Nome do completo do responsável legal"
                  rules={[
                    {
                      required: true,
                      message: "Por favor, insira o nome do responsável legal",
                    },
                  ]}
                >
                  <Input
                    placeholder="Ex: Maria Silva"
                    disabled={!isBusAvailable}
                  />
                </Form.Item>

                <div className="flex flex-col md:flex-row gap-4">
                  <Form.Item
                    name="legalGuardianEmail"
                    label="Email do responsável legal (opcional)"
                    rules={[
                      {
                        validator: (_, value) => {
                          if (!value || String(value).trim() === "") {
                            return Promise.resolve();
                          }
                          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                          if (!emailRegex.test(String(value))) {
                            return Promise.reject(
                              new Error("Por favor, insira um email válido")
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                    className="flex-1"
                  >
                    <Input
                      placeholder="Ex: maria@exemplo.pt"
                      disabled={!isBusAvailable}
                    />
                  </Form.Item>

                  <Form.Item
                    name="legalGuardianPhone"
                    label="Telefone do responsável legal"
                    rules={[
                      {
                        required: true,
                        message: "Por favor, insira o número de telefone do responsável legal",
                      },
                      {
                        pattern: /^\+?[1-9]\d{1,14}$/,
                        message: "Por favor, insira um número de telefone válido",
                      },
                    ]}
                    className="flex-1"
                  >
                    <Input
                      placeholder="Ex: 912345678"
                      disabled={!isBusAvailable}
                      maxLength={9}
                      type="tel"
                    />
                  </Form.Item>
                </div>
              </motion.div>

              <motion.div
                key="medical-release-form"
                initial={sectionAnimation.initial}
                animate={sectionAnimation.animate}
                exit={sectionAnimation.exit}
                transition={sectionTransition(0)}
              >
                <Alert
                  title="Formulário de Autorização Médica"
                  description={
                    <div>
                      <Paragraph>
                        Por favor, descarregue e complete o formulário de autorização
                        médica e permissão dos pais/responsáveis. Este formulário
                        deve ser entregue completo no dia da viagem.
                      </Paragraph>

                      <Button type="primary" href="/documents/2017_parental_or_guardian_permission_medical_release.pdf" target="_blank">Descarregar formulário PDF</Button>
                    </div>
                  }
                  type="info"
                  showIcon
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {ageCategory === "ADULT" &&
            !isFirstTimeConvert &&
            !hasLessThanOneYearAsMember && (
              <motion.div
                key="is-officiator"
                initial={sectionAnimation.initial}
                animate={sectionAnimation.animate}
                exit={sectionAnimation.exit}
                transition={sectionTransition(0)}
                className="p-4 rounded-2xl bg-white border border-gray-200 flex flex-col"
              >
                <div className="flex flex-col gap-2">
                  <Title level={5}>És oficiante do templo em Portugal?</Title>
                  <Paragraph>Os oficiantes do templo devem ter sido ordenados no templo de Portugal. Se for oficiante de outro templo não deve marcar esta opção.</Paragraph>
                </div>

                <Form.Item
                  name="isOfficiator"
                  valuePropName="checked"
                >
                  <Checkbox disabled={!isBusAvailable}>Confirmo que sou oficiante do templo em Portugal</Checkbox>
                </Form.Item>
              </motion.div>
            )}
        </AnimatePresence>
      </motion.div>

      {/* Section 3: Ordinances */}
      <AnimatePresence>
        {shouldShowOrdinancesStep && (gender === "M" || gender === "F") && (
          <motion.div
            key="ordinances-section"
            className={
              !isBusAvailable
                ? "bg-white p-4 rounded-2xl opacity-50 transition-all pointer-events-none"
                : "bg-white p-4 rounded-2xl"
            }
            initial={sectionAnimation.initial}
            animate={sectionAnimation.animate}
            exit={sectionAnimation.exit}
            transition={sectionTransition(0.12)}
          >
            <div className="flex flex-col gap-2">
              <Title level={4}>
                Ordenanças
              </Title>

              <Paragraph>Por favor, selecione pelo menos uma ordenança que deseja realizar.<strong> Caso não venha a realizar nenhuma, marque a última opção.</strong></Paragraph>
            </div>

            <OrdinancesListField
              form={form as unknown as FormInstance<{ ordinances: OrdinanceFormValue[] }>}
              selectedCaravanId={selectedCaravanId}
              gender={gender}
              ordinances={ordinances}
              ageCategory={ageCategory || "ADULT"}
              isFirstTimeConvert={isFirstTimeConvert}
              hasLessThanOneYearAsMember={hasLessThanOneYearAsMember}
              ordinancesList={ordinancesList}
              skipsOrdinances={skipsOrdinances ?? false}
              disabled={!isBusAvailable}
            />

            <Divider />


            <AnimatePresence>
              <motion.div
                key="is-officiator"
                initial={sectionAnimation.initial}
                animate={sectionAnimation.animate}
                exit={sectionAnimation.exit}
                transition={sectionTransition(0)}
                className="p-4 rounded-2xl bg-red-50 border border-red-200 flex flex-col"
              >

                <div className="flex flex-col gap-2">
                  <Title level={5}>Não vou fazer ordenanças</Title>
                  <Paragraph>Por favor, marque esta opção se não deseja fazer nenhuma ordenança nesta viagem.</Paragraph>
                </div>

                <Form.Item
                  name="skipsOrdinances"
                  valuePropName="checked"
                  initialValue={false}
                  required={!ordinancesList.some(
                    (o) => o != null && !!o.ordinanceId && !!o.slot
                  )}
                  rules={[
                    {
                      validator: (_, value) => {
                        const hasOrdinances = ordinancesList.some(
                          (o) => o != null && !!o.ordinanceId && !!o.slot
                        );
                        if (!hasOrdinances && !value) {
                          return Promise.reject(
                            new Error(
                              "Deve selecionar pelo menos uma ordenança ou marcar que não vai fazer ordenanças"
                            )
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Checkbox disabled={!isBusAvailable}>Confirmo que não vou fazer nenhuma ordenança</Checkbox>
                </Form.Item>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section 4: Privacy Policy */}
      <motion.div
        className={
          !isBusAvailable ? "opacity-50 transition-all pointer-events-none" : ""
        }
        initial={sectionAnimation.initial}
        animate={sectionAnimation.animate}
        transition={sectionTransition(0.18)}
      >
        <Title level={4} className="mb-4">
          Políticas de Privacidade
        </Title>
        <Paragraph>
          Ao se inscrever na viagem, você concorda com o uso dos
          dados registrados para fins de gestão da viagem ao templo. Este
          sistema não é oficial da Igreja de Jesus Cristo dos Santos dos
          Últimos Dias.
        </Paragraph>

        <Form.Item
          name="privacyPolicyAccepted"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) => {
                if (!value) {
                  return Promise.reject(
                    new Error(
                      "Deve aceitar a política de privacidade para continuar"
                    )
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Checkbox disabled={!isBusAvailable}>
            Aceito a{" "}
            <Button
              type="link"
              onClick={() => setPrivacyPolicyModalOpen(true)}
              className="p-0 h-auto font-normal"
              style={{ padding: 0, height: "auto" }}
            >
              política de privacidade
            </Button>{" "}
            e autorizo o uso dos meus dados para fins de gestão da viagem
          </Checkbox>
        </Form.Item>

        <PrivacyPolicyModal
          open={privacyPolicyModalOpen}
          onClose={() => setPrivacyPolicyModalOpen(false)}
        />
      </motion.div>

      {/* Section 5: Submit Button */}
      <Form.Item>
        <motion.div
          className={
            !isBusAvailable ? "flex flex-col gap-3 opacity-50 transition-all" : "flex flex-col gap-3"
          }
          initial={sectionAnimation.initial}
          animate={sectionAnimation.animate}
          transition={sectionTransition(0.24)}
        >
          <Button
            size="large"
            type="primary"
            htmlType="submit"
            loading={isPending}
            disabled={!isBusAvailable}
            className="w-full"
          >
            {isPending
              ? mode === "create"
                ? "A inscrever..."
                : "A atualizar..."
              : mode === "create"
                ? "Me inscrever"
                : "Atualizar inscrição"}
          </Button>

          <Button
            size="large"
            onClick={() => router.back()}
            className="w-full"
          >
            Cancelar
          </Button>
        </motion.div>
      </Form.Item>
    </Form>
  );
};
