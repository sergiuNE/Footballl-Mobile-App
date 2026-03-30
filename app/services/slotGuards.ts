import { db } from "../../config/firebase";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { collection, getDocs, deleteDoc, getDoc } from "firebase/firestore";

export async function cleanupExpiredMatches() {
  const matchesSnap = await getDocs(collection(db, "matches"));
  const now = Date.now();

  for (const matchDoc of matchesSnap.docs) {
    const match = matchDoc.data();
    if (match.reservationId) {
      // Check reservation
      const reservationRef = doc(db, "reservations", match.reservationId);
      const reservationSnap = await getDoc(reservationRef);
      if (
        !reservationSnap.exists() ||
        (reservationSnap.data().startsAtMs &&
          reservationSnap.data().startsAtMs < now)
      ) {
        // Reservation is gone or in the past: delete match
        await deleteDoc(doc(db, "matches", matchDoc.id));
      }
    }
  }
}

const normalizeDate = (date: string) => date.trim().slice(0, 10); // yyyy-mm-dd
const normalizeTime = (time: string) => time.trim().slice(0, 5); // HH:mm
const toHour = (time: string) => `${normalizeTime(time).slice(0, 2)}:00`; // per uur
const normalizeField = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const makeSlotKey = (fieldKey: string, date: string, time: string) =>
  `${normalizeField(fieldKey)}_${normalizeDate(date)}_${toHour(time)}`;

const toStartsAtMs = (date: string, time: string) => {
  const [y, m, d] = normalizeDate(date).split("-").map(Number);
  const [hh] = toHour(time).split(":").map(Number);
  return new Date(y, m - 1, d, hh, 0, 0, 0).getTime();
};

export async function createReservationUnique(payload: {
  fieldId: string;
  fieldName: string;
  date: string;
  time: string;
  timeSlot?: string;
  userId: string;
  [key: string]: any;
}) {
  const date = normalizeDate(payload.date);
  const time = toHour(payload.time);

  // use stable field id for uniqueness
  const fieldKey = payload.fieldId || payload.fieldName;
  const slotKey = makeSlotKey(fieldKey, date, time);
  const startsAtMs = toStartsAtMs(date, time);

  const reservationRef = doc(db, "reservations", slotKey);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(reservationRef);
    if (snap.exists()) throw new Error("RESERVATION_SLOT_TAKEN");

    tx.set(reservationRef, {
      ...payload,
      fieldKey: normalizeField(fieldKey),
      date,
      time, // HH:00
      timeSlot: payload.timeSlot ?? time,
      slotKey,
      startsAtMs,
      createdAt: serverTimestamp(),
    });
  });
}

export async function createMatchUnique(payload: {
  fieldId: string;
  date: string;
  time: string;
  ownerId: string;
  [key: string]: any;
}) {
  const date = normalizeDate(payload.date);
  const time = toHour(payload.time);

  const slotKey = makeSlotKey(payload.fieldId, date, time);
  const startsAtMs = toStartsAtMs(date, time);

  const matchRef = doc(db, "matches", slotKey);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(matchRef);
    if (snap.exists()) throw new Error("MATCH_SLOT_TAKEN");

    tx.set(matchRef, {
      ...payload,
      date,
      time, // HH:00
      slotKey,
      startsAtMs,
      createdAt: serverTimestamp(),
    });
  });
}
