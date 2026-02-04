export interface GeoPoint {
    lat: number;
    lng: number;
}

export interface MapBounds {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
}

export interface TileCoordinate {
    x: number;
    y: number;
    z: number;
}

/**
 * Calculates a unique string ID for a tile coordinate
 */
export const getTileId = (tile: TileCoordinate): string => {
    return `${tile.z}-${tile.x}-${tile.y}`;
};

/**
 * Converts a lat/lng point to a tile coordinate at a specific zoom level
 * Uses Web Mercator projection (standard for OSM, Google Maps)
 */
export const latLngToTile = (lat: number, lng: number, zoom: number): TileCoordinate => {
    const n = Math.pow(2, zoom);
    const x = Math.floor(((lng + 180) / 360) * n);
    const latRad = (lat * Math.PI) / 180;
    const y = Math.floor(
        ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
    );
    return { x, y, z: zoom };
};

/**
 * Converts a tile coordinate to its bounding box (minLat, maxLat, minLng, maxLng)
 */
export const tileToBounds = (x: number, y: number, z: number): MapBounds => {
    const n = Math.pow(2, z);

    const minLng = (x / n) * 360 - 180;
    const maxLng = ((x + 1) / n) * 360 - 180;

    const n2 = Math.PI - (2 * Math.PI * y) / n;
    const maxLat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n2) - Math.exp(-n2)));

    const n3 = Math.PI - (2 * Math.PI * (y + 1)) / n;
    const minLat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n3) - Math.exp(-n3)));

    return { minLat, maxLat, minLng, maxLng };
};

/**
 * Returns all tile coordinates that overlap with the given bounding box
 */
export const getTilesInBounds = (bounds: MapBounds, zoom: number): TileCoordinate[] => {
    const minTile = latLngToTile(bounds.maxLat, bounds.minLng, zoom);
    const maxTile = latLngToTile(bounds.minLat, bounds.maxLng, zoom);

    const tiles: TileCoordinate[] = [];

    for (let x = minTile.x; x <= maxTile.x; x++) {
        for (let y = minTile.y; y <= maxTile.y; y++) {
            tiles.push({ x, y, z: zoom });
        }
    }

    return tiles;
};

/**
 * Default grid size (in degrees) for simple clustering if not using tiles
 */
export const GRID_SIZE = 0.01; // Approx 1km

/**
 * Simple hash function for caching keys
 */
export const generateCacheKey = (bounds: MapBounds): string => {
    // Round to 3 decimal places to group nearby requests
    const precise = (n: number) => Math.round(n * 1000) / 1000;
    return `${precise(bounds.minLat)},${precise(bounds.maxLat)},${precise(bounds.minLng)},${precise(bounds.maxLng)}`;
};
