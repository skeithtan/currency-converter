import fx from "money";

const CONVERSION_KEY = "fxConversion";

export async function fetchConversion() {
    const data = await (async () => {
        const cache = tryGetConversionCache();
        if (cache) {
            return cache;
        }

        const response = await fetch(
            `https://openexchangerates.org/api/latest.json?app_id=6429b8a9043341dc8b540da0bfec5f11`,
        );
        return await response.json();
    })();

    localStorage.setItem(
        CONVERSION_KEY,
        JSON.stringify({
            rates: data.rates,
            base: data.base,
            fetchedAt: new Date().toISOString(),
        }),
    );

    if (fx.rates) {
        fx.rates = data.rates;
        fx.base = data.base;
    }
}

function tryGetConversionCache() {
    const conversionCache = localStorage.getItem(CONVERSION_KEY);
    if (conversionCache) {
        try {
            const data = JSON.parse(conversionCache);
            const lastFetchedAt = new Date(data.fetchedAt);
            const timeDifference = new Date().getTime() - lastFetchedAt.getTime();
            const hoursDifference = Math.abs(timeDifference / (1000 * 3600));
            if (hoursDifference > 24) {
                return undefined;
            }

            return data;
        } catch {
            return undefined;
        }
    }
}
