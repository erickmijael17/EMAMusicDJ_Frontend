import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  // Navegación principal
  faHome, faSearch, faBook, faCog, faUsers, faUser,

  // Acciones de música
  faPlay, faPause, faStop, faForward, faBackward,
  faVolumeUp, faVolumeDown, faVolumeMute, faRandom, faRedo,

  // Interacción del usuario
  faHeart, faPlusSquare, faEllipsisH, faEllipsisV, faSignOutAlt, faSignInAlt, faMusic, faGuitar, faDrum, faMicrophone,

  // Formularios y Autenticación
  faEnvelope, faLock, faEye, faEyeSlash,

  // Playlists y CRUD
  faList, faPlus, faEdit, faTrash, faCalendar, faClock,

  // Utilidades
  faTimes, faExclamationTriangle, faCheck, faInfoCircle

} from '@fortawesome/free-solid-svg-icons';

import {
  faHeart as faHeartRegular,
  faPlusSquare as faPlusSquareRegular
} from '@fortawesome/free-regular-svg-icons';

/**
 * Define la estructura de un ítem en nuestra biblioteca de iconos,
 * incluyendo palabras clave para búsquedas semánticas.
 */
export interface IconLibraryItem {
  name: keyof AppIconsMap;
  icon: IconDefinition;
  keywords: string[];
}

// Define todos los nombres de los iconos que usaremos para tener tipado fuerte.
export interface AppIconsMap {
  // Navegación
  home: IconDefinition;
  search: IconDefinition;
  library: IconDefinition;
  settings: IconDefinition;
  community: IconDefinition;
  profile: IconDefinition;
  login: IconDefinition;
  logout: IconDefinition;

  // Formularios y Autenticación
  email: IconDefinition;
  lock: IconDefinition;
  eye: IconDefinition;
  eyeSlash: IconDefinition;

  // Controles de música
  play: IconDefinition;
  pause: IconDefinition;
  stop: IconDefinition;
  next: IconDefinition;
  previous: IconDefinition;
  volumeUp: IconDefinition;
  volumeDown: IconDefinition;
  volumeMute: IconDefinition;
  shuffle: IconDefinition;
  repeat: IconDefinition;

  // Interacción
  like: IconDefinition;
  likeOutline: IconDefinition;
  addToPlaylist: IconDefinition;
  addToPlaylistOutline: IconDefinition;
  options: IconDefinition;
  moreVertical: IconDefinition;

  // Genéricos
  music: IconDefinition;
  guitar: IconDefinition;
  drum: IconDefinition;
  microphone: IconDefinition;

  // Playlists
  playlist: IconDefinition;
  add: IconDefinition;
  edit: IconDefinition;
  delete: IconDefinition;
  calendar: IconDefinition;
  clock: IconDefinition;

  // Utilidades
  close: IconDefinition;
  error: IconDefinition;
  warning: IconDefinition;
  info: IconDefinition;
  check: IconDefinition;
}

/**
 * La biblioteca central de iconos para Emma Music.
 * Esta es la única fuente de verdad para los iconos en la aplicación.
 */
export const APP_ICONS: AppIconsMap = {
  home: faHome, search: faSearch, library: faBook, settings: faCog, community: faUsers, profile: faUser,
  play: faPlay, pause: faPause, stop: faStop, next: faForward, previous: faBackward,
  volumeUp: faVolumeUp, volumeDown: faVolumeDown, volumeMute: faVolumeMute, shuffle: faRandom, repeat: faRedo,
  like: faHeart, likeOutline: faHeartRegular, addToPlaylist: faPlusSquare, addToPlaylistOutline: faPlusSquareRegular,
  options: faEllipsisH, moreVertical: faEllipsisV, login: faSignInAlt, logout: faSignOutAlt, music: faMusic, guitar: faGuitar, drum: faDrum, microphone: faMicrophone,
  // Formularios y Autenticación
  email: faEnvelope,
  lock: faLock,
  eye: faEye,
  eyeSlash: faEyeSlash,
  // Playlists
  playlist: faList,
  add: faPlus,
  edit: faEdit,
  delete: faTrash,
  calendar: faCalendar,
  clock: faClock,
  // Utilidades
  close: faTimes,
  error: faExclamationTriangle,
  warning: faExclamationTriangle,
  info: faInfoCircle,
  check: faCheck
};
