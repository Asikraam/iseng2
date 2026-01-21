window.askGemini = async (userQuery, systemPrompt, chatHistory = []) => {
    // Pastikan BACKEND_URL sudah terload dari config.js
    const endpoint = window.BACKEND_URL || "/api/chat";

    const contents = chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: userQuery }] });

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: contents,
                systemInstruction: { parts: [{ text: systemPrompt }] }
            })
        });

        if (!response.ok) throw new Error("Gagal menghubungi backend");

        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, asisten sedang sibuk.";
    } catch (error) {
        console.error("AI Error:", error);
        return "Gagal terhubung ke AI. Pastikan server backend aktif dan API Key valid.";
    }
};
