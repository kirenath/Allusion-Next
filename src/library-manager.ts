import fse from 'fs-extra';
import path from 'path';
import { LibraryInfo, LibraryRegistryMessage } from './ipc/messages';

/**
 * Manages the registry of image libraries (Obsidian-vault-style).
 * A library is any folder on disk containing `databases/Allusion.sqlite`,
 * `backups/` and `watcher_snapshots/`. The registry itself is a JSON file
 * in the (global) userData directory, keeping track of known libraries and
 * which one is currently active.
 */

type LibraryRegistryFile = {
  libraries: LibraryInfo[];
  activePath: string | null;
  showPickerOnStartup: boolean;
};

const REGISTRY_FILENAME = 'libraries.json';

export default class LibraryManager {
  #registryFilePath: string;
  #registry: LibraryRegistryFile;

  constructor(userDataPath: string) {
    fse.ensureDirSync(userDataPath);
    this.#registryFilePath = path.join(userDataPath, REGISTRY_FILENAME);
    this.#registry = this.#load(userDataPath);
  }

  #load(userDataPath: string): LibraryRegistryFile {
    try {
      const reg = fse.readJSONSync(this.#registryFilePath) as LibraryRegistryFile;
      if (Array.isArray(reg.libraries)) {
        return {
          libraries: reg.libraries,
          activePath: typeof reg.activePath === 'string' ? reg.activePath : null,
          showPickerOnStartup: Boolean(reg.showPickerOnStartup),
        };
      }
    } catch (e) {
      // No registry yet: first run with this feature
    }

    const registry: LibraryRegistryFile = {
      libraries: [],
      activePath: null,
      showPickerOnStartup: false,
    };

    // Backwards compatibility: if a database already exists in userData,
    // register userData itself as the "default" library so existing users
    // keep their data without any migration.
    const legacyDbPath = path.join(userDataPath, 'databases', 'Allusion.sqlite');
    if (fse.pathExistsSync(legacyDbPath)) {
      registry.libraries.push({
        path: userDataPath,
        name: 'Allusion',
        lastOpened: Date.now(),
        isDefault: true,
      });
      registry.activePath = userDataPath;
    }

    this.#save(registry);
    return registry;
  }

  #save(registry: LibraryRegistryFile = this.#registry): void {
    try {
      fse.writeJSONSync(this.#registryFilePath, registry, { spaces: 2 });
    } catch (e) {
      console.error('LibraryManager: could not save registry', e);
    }
  }

  getRegistry(): LibraryRegistryMessage {
    return {
      libraries: [...this.#registry.libraries].sort((a, b) => b.lastOpened - a.lastOpened),
      activePath: this.#registry.activePath,
      showPickerOnStartup: this.#registry.showPickerOnStartup,
    };
  }

  /** Returns the active library, or null when the user has yet to pick one. */
  getActiveLibrary(): LibraryInfo | null {
    if (this.#registry.activePath === null) {
      return null;
    }
    const lib = this.#registry.libraries.find((l) => l.path === this.#registry.activePath);
    if (lib !== undefined) {
      try {
        this.#ensureLibraryStructure(lib.path);
      } catch (e) {
        console.error('LibraryManager: could not access library folder', lib.path, e);
        return null;
      }
    }
    return lib ?? null;
  }

  shouldShowPickerOnStartup(): boolean {
    return this.#registry.showPickerOnStartup || this.getActiveLibrary() === null;
  }

  /**
   * Sets the given folder as the active library, registering it if unknown.
   * Creates the library folder structure when missing (new library).
   */
  setActiveLibrary(libraryPath: string): LibraryInfo {
    const normalizedPath = path.resolve(libraryPath);
    this.#ensureLibraryStructure(normalizedPath);

    let lib = this.#registry.libraries.find((l) => l.path === normalizedPath);
    if (lib === undefined) {
      lib = {
        path: normalizedPath,
        name: path.basename(normalizedPath),
        lastOpened: Date.now(),
      };
      this.#registry.libraries.push(lib);
    } else {
      lib.lastOpened = Date.now();
    }
    this.#registry.activePath = normalizedPath;
    this.#save();
    return lib;
  }

  removeFromRecents(libraryPath: string): void {
    this.#registry.libraries = this.#registry.libraries.filter((l) => l.path !== libraryPath);
    if (this.#registry.activePath === libraryPath) {
      this.#registry.activePath = null;
    }
    this.#save();
  }

  setShowPickerOnStartup(show: boolean): void {
    this.#registry.showPickerOnStartup = show;
    this.#save();
  }

  #ensureLibraryStructure(libraryPath: string): void {
    fse.ensureDirSync(path.join(libraryPath, 'databases'));
    fse.ensureDirSync(path.join(libraryPath, 'backups'));
    fse.ensureDirSync(path.join(libraryPath, 'watcher_snapshots'));
  }
}
