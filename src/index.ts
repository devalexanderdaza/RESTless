// Exportaciones Core
export { Server } from './core/server';
export { Database } from './core/db';
export type { StorageType } from './core/db';
export { Router } from './core/router';
export * from './core/types';

// Exportaciones de Storage
export * from './core/storage';

// Exportaciones de Utilidades
export * from './core/utils/DataExporter';

// Exportaciones UI
export { App } from './ui/app';
export * from './ui/components/';

// Versión y metadatos
export const VERSION = '1.5.0';
export const AUTHOR = 'Alexander Daza';
export const LICENSE = 'MIT';