import { AppState, AppStateStatus } from "react-native";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";

export function startPresenceTracking(uid: string) {
  const ref = doc(db, "users", uid);

  const setOnline = async () => {
    await setDoc(
      ref,
      { isOnline: true, lastSeen: serverTimestamp() },
      { merge: true },
    );
  };

  const setOffline = async () => {
    await setDoc(
      ref,
      { isOnline: false, lastSeen: serverTimestamp() },
      { merge: true },
    );
  };

  void setOnline().catch((e: any) =>
    console.log("presence online error:", e?.code, e?.message),
  );

  const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
    const p = state === "active" ? setOnline() : setOffline();
    void p.catch((e: any) =>
      console.log("presence state error:", e?.code, e?.message),
    );
  });

  return async () => {
    sub.remove();
    await setOffline().catch((e: any) =>
      console.log("presence offline error:", e?.code, e?.message),
    );
  };
}
