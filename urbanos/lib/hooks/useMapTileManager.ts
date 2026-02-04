import { useState, useRef, useCallback, useEffect } from 'react';
import { MapBounds, TileCoordinate, getTilesInBounds, getTileId, tileToBounds } from '@/lib/services/map-service';

interface UseMapTileManagerOptions<T> {
    fetchData: (bounds: MapBounds, zoom: number) => Promise<T[]>;
    zoom?: number;
    tileSize?: number; // Not used for calculation but for concept
    deduplicate?: (items: T[]) => T[];
}

export function useMapTileManager<T>({
    fetchData,
    zoom = 12,
    deduplicate
}: UseMapTileManagerOptions<T>) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadedTileIds, setLoadedTileIds] = useState<Set<string>>(new Set());

    // Keep track of ongoing requests to prevent duplicates
    const activeRequests = useRef<Set<string>>(new Set());

    // Debounce ref
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    const updateVisibleRegion = useCallback(async (bounds: MapBounds, currentZoom: number) => {
        // If zoom is too low (zoomed out), we might want to restrict or cluster, 
        // but for now we'll just stick to a fixed "data zoom level" strategy 
        // or use the current zoom if it's reasonable.
        // Fixed zoom level for data grid is often simpler:
        const gridZoom = Math.min(Math.max(currentZoom, 10), 14); // Clamp zoom for grid calculation

        // 1. Calculate which tiles are visible
        const visibleTiles = getTilesInBounds(bounds, gridZoom);

        // 2. Filter out tiles that are already loaded
        const missingTiles = visibleTiles.filter(tile => {
            const id = getTileId(tile);
            return !loadedTileIds.has(id) && !activeRequests.current.has(id);
        });

        if (missingTiles.length === 0) return;

        setLoading(true);

        // 3. Update loading state for these tiles immediately
        const newActiveIds = new Set(activeRequests.current);
        missingTiles.forEach(tile => newActiveIds.add(getTileId(tile)));
        activeRequests.current = newActiveIds;

        try {
            // 4. Fetch data for missing tiles
            // Optimization: Group adjacent tiles or just fire parallel requests
            // For simplicity and HTTP/2 efficiency, we'll request them in parallel but limited batching could be better

            const newItemsChunks = await Promise.all(
                missingTiles.map(async (tile) => {
                    const tileBounds = tileToBounds(tile.x, tile.y, tile.z);
                    try {
                        return await fetchData(tileBounds, gridZoom);
                    } catch (err) {
                        console.error(`Failed to fetch tile ${getTileId(tile)}`, err);
                        return [];
                    }
                })
            );

            const newItemsFlat = newItemsChunks.flat();

            // 5. Update state
            if (newItemsFlat.length > 0) {
                setData(prevData => {
                    const combined = [...prevData, ...newItemsFlat];
                    return deduplicate ? deduplicate(combined) : combined;
                });
            }

            // 6. Mark tiles as loaded
            setLoadedTileIds(prev => {
                const next = new Set(prev);
                missingTiles.forEach(tile => {
                    next.add(getTileId(tile));
                    activeRequests.current.delete(getTileId(tile));
                });
                return next;
            });

        } catch (error) {
            console.error('Error updating map tiles:', error);
        } finally {
            setLoading(false);
        }
    }, [fetchData, loadedTileIds, deduplicate]);

    const onMoveEnd = useCallback((bounds: MapBounds, zoom: number) => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            updateVisibleRegion(bounds, zoom);
        }, 300); // 300ms debounce
    }, [updateVisibleRegion]);

    return {
        data,
        loading,
        onMoveEnd,
        loadedTileIds // exposed for debugging or drawing debug grid
    };
}
