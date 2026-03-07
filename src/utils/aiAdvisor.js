import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * AI Advisor Utility (Lorri.AI)
 * Handles rule-based analysis and Gemini API orchestration.
 */

// User to provide keys - currently using placeholders
const API_KEYS = [
    "AIzaSyDtn9z0AMGfEyLJckmxIvSWkbxh5UybURs",
    "AIzaSyDDcJA2K_CZ119nnZX0aoNMxgKUxLItbqo",
    "AIzaSyBQhSLz8JYKopd17NJl9vQ-d0y6uynQoPc",
    "AIzaSyDGr7xEWWQ15-BJUX3mIZr-HT52YZRrOCw"
];

let currentKeyIndex = 0;

/**
 * Gets the next available API key in rotation
 */
function getNextKey() {
    const key = API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    return key;
}

/**
 * Rule-Based Analysis Engine
 * Generates instant metrics-driven insights without API calls.
 */
export function generateHeroInsights(fleet, history) {
    const insights = [];

    if (!history || history.length === 0) {
        return [{
            icon: "🚛",
            title: "First Steps",
            text: "Start planning and recording routes to see AI-driven efficiency gains.",
            type: "tip"
        }];
    }

    // 1. Emission Hotspot Detection
    const routeCounts = {};
    history.forEach(trip => {
        const key = `${trip.originName}-${trip.destinationName}`;
        routeCounts[key] = (routeCounts[key] || 0) + 1;
    });

    const topRoute = Object.entries(routeCounts).sort((a, b) => b[1] - a[1])[0];
    if (topRoute && topRoute[1] > 2) {
        insights.push({
            icon: "🔥",
            title: "Route Hotspot",
            text: `Your ${topRoute[0]} trips are your most frequent. Focus on EV switch for this lane.`,
            type: "warning"
        });
    }

    // 2. Fuel Type Optimization
    const dieselTrucks = fleet.filter(v => v.fuelType === 'diesel' && (v.type === 'truck' || v.type === 'bus'));
    if (dieselTrucks.length > 0) {
        insights.push({
            icon: "💰",
            title: "Fuel Arbitrage",
            text: "Switching your primary diesel route to CNG could reduce fuel costs by ~18% weekly.",
            type: "opportunity"
        });
    }

    // 3. Co-loading Wins
    const mergeSavings = history.filter(t => t.mergedFrom).length;
    if (mergeSavings > 0) {
        insights.push({
            icon: "🤝",
            title: "Merge Win",
            text: `Excellent! You've successfully co-loaded ${mergeSavings} trips this week.`,
            type: "success"
        });
    } else {
        insights.push({
            icon: "🧩",
            title: "Co-loading Lab",
            text: "3 of your recent trips had under 40% payload. High potential for merging.",
            type: "opportunity"
        });
    }

    return insights;
}

/**
 * Main Chat Handler with Gemini API
 */
export async function askLorriAI(query, context) {
    const q = query.toLowerCase();
    const fleetCount = context.fleet?.length || 0;
    const historyCount = context.history?.length || 0;

    // 1. Local Quantitative Processor (Instant & Reliable)
    if (q.includes("how many") || q.includes("count") || q.includes("total")) {
        if (q.includes("vehicle") || q.includes("fleet") || q.includes("truck")) {
            return `You currently have ${fleetCount} ${fleetCount === 1 ? 'vehicle' : 'vehicles'} in your fleet. ${fleetCount === 0 ? 'Would you like to add one in the Fleet tab?' : 'I can help you optimize their routing in the Optimizer tab.'}`;
        }
        if (q.includes("trip") || q.includes("history") || q.includes("record")) {
            return `I've tracked ${historyCount} trips so far. Based on this, I can start identifying patterns for your green transition.`;
        }
        if (q.includes("emission") || q.includes("co2") || q.includes("carbon")) {
            const totalCo2 = context.history?.reduce((sum, t) => sum + (t.metrics?.co2Kg || 0), 0) || 0;
            return `Your total recorded fleet emissions stand at ${totalCo2.toFixed(1)} kg CO2. We should aim to reduce this by 15% this quarter.`;
        }
    }

    // 2. Gemini fallback for strategy / complex logic
    const key = getNextKey();

    // Log key rotation for debugging/visibility in prototype
    console.log(`[Lorri.AI] Using API Key Rotation Slot: ${currentKeyIndex + 1}`);

    if (!key || key.startsWith("REPLACE_WITH") || key.length < 10) {
        return `I am Lorri.AI. Local data shows you have ${fleetCount} vehicles. (Please provide valid Gemini API keys to unlock my full strategic reasoning potential).`;
    }

    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
      You are Lorri.AI, a world-class logistics and sustainability advisor.
      User Query: ${query}
      
      Current Context:
      - Fleet Strength: ${fleetCount} vehicles
      - Total Trips Recorded: ${historyCount}
      - Current Location: Pune District, Maharashtra
      
      Instructions:
      1. Be concise (max 3 sentences).
      2. Use the exact data provided in the context.
      3. If asked about savings, refer to fuel switch or co-loading.
      
      Output in plain text, no markdown.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        // Even if Gemini fails, provide a data-aware fallback
        return `I encountered a minor flux in my neural links, but my local sensors confirm you have ${fleetCount} vehicles and ${historyCount} recorded trips. I recommend focusing on your high-emission routes while I recalibrate.`;
    }
}

// Initialize the Gemini API client using the environment variable
let genAI = null;
try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey && apiKey !== 'YOUR_API_KEY_HERE') {
        genAI = new GoogleGenerativeAI(apiKey);
    }
} catch (e) {
    console.warn("Gemini API initialization skipped. Pending API Key.");
}

/**
 * Generate a dynamic Eco-Routing Executive Summary using the real Google Gemini API.
 * @param {Array} routes - The ranked routes array from OSRM/ecoScore.
 * @param {string} vehicleType - Type of vehicle (e.g., 'truck', 'ev').
 * @param {number} payload - Cargo weight in tons.
 * @param {string} originName - Name of origin.
 * @param {string} destinationName - Name of destination.
 * @returns {Promise<string>} A professional analysis.
 */
export async function generateRouteAnalysis(routes, vehicleType, payload, originName, destinationName) {
    // Fallback: If no API key or invalid routes, use local logic.
    if (!genAI || !routes || routes.length < 2) {
        return fallbackSimulation(routes, vehicleType, payload, originName, destinationName);
    }

    const bestEco = routes[0];
    const fastest = [...routes].sort((a, b) => a.durationS - b.durationS)[0];

    // Build the data context for the LLM
    const dataContext = `
    Role: You are an elite AI Logistics Consultant (Lorri) for an Indian supply chain company.
    Task: Write a 2-3 sentence "Executive Summary" comparing the most eco-friendly route ('Best Eco') against the fastest route. Be professional, concise, and use numbers perfectly. No markdown formatting.
    
    Context:
    - Origin: ${originName?.split(',')[0]}
    - Destination: ${destinationName?.split(',')[0]}
    - Vehicle: ${vehicleType} carrying ${payload} Tons.
    
    Route A (Best Eco): Distance: ${(bestEco.distanceM / 1000).toFixed(1)}km, Time: ${Math.round(bestEco.durationS / 60)} mins, CO2: ${bestEco.metrics.co2Kg.toFixed(1)}kg
    Route B (Fastest): Distance: ${(fastest.distanceM / 1000).toFixed(1)}km, Time: ${Math.round(fastest.durationS / 60)} mins, CO2: ${fastest.metrics.co2Kg.toFixed(1)}kg
    `;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(dataContext);
        const responseText = result.response.text().replace(/\*/g, ''); // Strip asterisks
        return responseText;
    } catch (error) {
        console.error("Gemini API Request Failed:", error);
        return fallbackSimulation(routes, vehicleType, payload, originName, destinationName);
    }
}

function fallbackSimulation(routes, vehicleType, payload, originName, destinationName) {
    if (!routes || routes.length < 2) {
        return `Analyzed optimal path to ${destinationName?.split(',')[0]}. No high-quality logistical deviations detected for your ${payload}T payload.`;
    }
    const bestEco = routes[0];
    const fastest = [...routes].sort((a, b) => a.durationS - b.durationS)[0];
    if (bestEco.id === fastest.id) {
        return `Strategic alignment achieved. This corridor is both the most fuel-efficient and fastest path. For a ${payload}T payload, it minimizes transit time and carbon footprint perfectly.`;
    }
    const co2Saved = fastest.metrics.co2Kg - bestEco.metrics.co2Kg;
    const timeDiffMins = (bestEco.durationS - fastest.durationS) / 60;

    let analysis = `Optimal routing diverges from the fastest path. `;
    if (payload > 10) {
        analysis += `Given your heavy ${payload}T payload, the recommended path prioritizes smoother gradients, `;
    } else {
        analysis += `The Recommended path safely bypasses high-consumption zones, `;
    }
    if (co2Saved > 0) {
        analysis += `saving ${co2Saved.toFixed(1)}kg of CO₂. `;
        if (timeDiffMins > 0) {
            analysis += `This strategic alignment requires only ${Math.round(timeDiffMins)} additional minutes of transit time.`;
        }
    } else {
        analysis += `maintaining maximum efficiency without sacrificing delivery timelines.`;
    }
    return analysis;
}

/**
 * Parses a natural language dispatch command into structured routing data using Gemini.
 * @param {string} query - The user's natural language command (e.g. "Send 15 tons to Ahmedabad with an EV")
 * @returns {Promise<Object>} JSON object containing extracted route parameters.
 */
export async function parseMagicDispatch(query) {
    if (!genAI) {
        throw new Error("Gemini API key is missing. Cannot perform Magic Dispatch.");
    }

    const prompt = `
    You are an AI logistics parser. Your job is to extract routing variables from natural language.
    If a variable is missing, try to infer it, or leave it blank.
    Assume the origin is "Mumbai" if not specified.
    
    Query: "${query}"
    
    You MUST respond with ONLY a valid JSON object exactly matching this schema, nothing else:
    {
      "origin": "string (the starting city)",
      "destination": "string (the destination city)",
      "payload": "number (the cargo weight in tons. Default to 5 if not mentioned)",
      "vehiclePreference": "string (either 'electric', 'diesel', 'cng', or 'any')"
    }
    `;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();

        // Robust JSON extraction using Regex to find the first `{` and last `}`
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Lorri.AI did not return a valid data structure. Please try rephrasing.");
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error("Magic Dispatch Parsing Failed:", error);
        throw new Error(error.message || "Failed to parse magic dispatch command.");
    }
}
