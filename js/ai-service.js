// js/ai-service.js
window.askGemini = async (userQuery, systemPrompt, chatHistory = []) => {
    const contents = chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));
    
    contents.push({ role: 'user', parts: [{ text: userQuery }] });

    const payload = { 
        contents: contents, 
        systemInstruction: { parts: [{ text: systemPrompt }] } 
    };

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Gagal akses backend");
        const result = await response.json();
        
        if (result.error) {
            console.error("Gemini Error:", result.error);
            return `Error: ${result.error.message}`;
        }

        return result.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, asisten sedang tidak merespon.";
    } catch (error) {
        console.error("Fetch Error:", error);
        return "Koneksi asisten AI bermasalah. Pastikan API di repo private sudah aktif.";
    }
};
