import { headers } from "next/headers";
import { redirect } from "next/navigation";
import list from "@/components/appointments/AppointmentList.module.scss";
import Sidebar from "@/components/layout/Sidebar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/slots";
import styles from "../Account.module.scss";

// შეტყობინებების გვერდი: ბოლო 50 შეტყობინება, ახლები ზემოთ
export default async function NotificationsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // გვერდის გახსნისას ყველა შეტყობინება წაკითხულად ითვლება. სია ზემოთ უკვე
  // წამოღებულია, ამიტომ ამ ერთხელ „ახალი“ ნიშანი მაინც გამოჩნდება
  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.main}>
        <h1 className={styles.title}>შეტყობინებები</h1>

        {notifications.length === 0 ? (
          <p className={list.empty}>შეტყობინებები არ გაქვს.</p>
        ) : (
          <ul className={list.list}>
            {notifications.map((notification) => (
              <li key={notification.id} className={list.item}>
                <div className={list.info}>
                  <h3>
                    {notification.message}
                    {!notification.isRead && (
                      <span className={`${list.status} ${list.BOOKED}`}>ახალი</span>
                    )}
                  </h3>
                  <p>{formatDateTime(notification.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
