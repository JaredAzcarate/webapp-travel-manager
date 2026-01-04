import { RegistrationWithId } from "../models/registrations.model";

export async function notifyChapelOnPayment(
  registration: RegistrationWithId
): Promise<void> {
  // Stub implementation - will be replaced with actual notification logic
  // This could send WhatsApp message or email to the chapel
  console.log(
    `Notification stub: User ${registration.fullName} (${registration.phone}) reported payment for caravan ${registration.caravanId}`
  );
  console.log(`Chapel ID: ${registration.chapelId}`);

  // TODO: Implement actual notification
  // - Get chapel data from Firestore
  // - Send WhatsApp message or email
  // - Log notification attempt
}
