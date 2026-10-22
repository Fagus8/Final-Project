// ბრაუზერიდან API-ზე მოთხოვნის გაგზავნა.
// აბრუნებს: ok — წარმატებით შესრულდა თუ არა, message — სერვერის პასუხის ტექსტი
export async function sendRequest(url: string, method: string, body?: unknown) {
  try {
    const response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const result = await response.json();

    return {
      ok: response.ok,
      message: (result.message as string | undefined) ?? (response.ok ? "" : "მოქმედება ვერ შესრულდა"),
    };
  } catch {
    // ინტერნეტი გაითიშა ან სერვერმა JSON არ დააბრუნა
    return { ok: false, message: "სერვერთან დაკავშირება ვერ მოხერხდა" };
  }
}
