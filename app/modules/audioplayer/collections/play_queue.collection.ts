import {PlayQueueItem} from '../models/play_queue_item.model';
import {BaseCollection} from '../../backbone/collections/base.collection';
import {Model} from 'backbone';
import {Track} from '../../tracks/models/track.model';

export class PlayQueue extends BaseCollection<Model> {
  private static instance: PlayQueue;

  private playIndex = 0;

  model = PlayQueueItem;

  static getInstance(): PlayQueue {
    if (PlayQueue.instance) {
      return PlayQueue.instance;
    } else {
      PlayQueue.instance = new PlayQueue();
      return PlayQueue.instance;
    }
  }

  comparator = (item: PlayQueueItem) => {
    return [item.get('priority'), item.get('position')];
  };

  getQueuedTracks(): Array<Track> {
    return this.where({ status: 'QUEUED' });
  }

  getScheduledTracks(): Array {
    return this.where({ status: 'NULL' });
  }

  getPlayingTrack(): Track {
    return this.findWhere({ status: 'PLAYING' });
  }

  getPausedTrack(): Track {
    return this.findWhere({ status: 'PAUSED' });
  }

  getCurrentTrack(): Track {
    return this.findWhere({ status: 'PLAYING' }) || this.findWhere({ status: 'PAUSED' });
  }

  getTrack(): Track {
    let pausedTrack = this.getPausedTrack();
    if (pausedTrack) {
      console.log(pausedTrack);
      return pausedTrack;
    }
    let queuedTracks = this.getQueuedTracks();
    if (queuedTracks.length > 0) {
      return queuedTracks[0];
    } else {
      let tracks = this.find((track: PlayQueueItem) => {
        return track.isScheduled();
      });
      if (tracks && tracks.length > 0) {
        return tracks[0];
      } else {
        return tracks;
      }
    }
  }

  hasNextTrack(): boolean {
    return this.playIndex < this.length - 1;
  }

  hasPreviousTrack(): boolean {
    return this.playIndex > 0;
  }

  hasCurrentTrack(): boolean {
    return;
  }

  getNextTrack(): Track {
    if (this.hasNextTrack()) {
      return this.at(this.playIndex + 1);
    }
  }

  getPreviousTrack(): Track {
    if (this.hasPreviousTrack()) {
      return this.at(this.playIndex - 1);
    }
  }

  addAndPlay(track: Track): PlayQueueItem {
    let queueItem: PlayQueueItem = this.add(track.toJSON());
    queueItem.play();
    return queueItem;
  }

  queue(track: PlayQueueItem|Object) {

  }

  initialize(): void {
    this.on('change:status', (track: PlayQueueItem) => {
      if (track.isPlaying()) {
        this.where({status: 'PLAYING'}).forEach((playingTrack) => {
          if (playingTrack.id !== track.id) {
            playingTrack.stop();
          }
        });
        this.playIndex = this.indexOf(track);
      }

      if (track.isPaused()) {
        this.where({status: 'PAUSED'}).forEach((playingTrack) => {
          if (playingTrack.id !== track.id) {
            playingTrack.stop();
          }
        });
      }
    });
  }
}
