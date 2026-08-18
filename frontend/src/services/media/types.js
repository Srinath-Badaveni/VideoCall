/**
 * types.js
 * 
 * Type definitions (JSDoc format for now, will become TS interfaces)
 * for the Media Abstraction layer.
 */

/**
 * @typedef {Object} MediaTrack
 * @property {string} id
 * @property {'audio'|'video'|'screen'} kind
 * @property {MediaStreamTrack} track
 * @property {boolean} isMuted
 */

/**
 * @typedef {Object} RemoteParticipant
 * @property {string} id
 * @property {string} name
 * @property {MediaTrack[]} tracks
 * @property {boolean} isSpeaking
 * @property {number} audioLevel
 */

/**
 * @typedef {'low'|'medium'|'high'} VideoQuality
 */

/**
 * @typedef {'low'|'high'} SubscriptionPriority
 */
