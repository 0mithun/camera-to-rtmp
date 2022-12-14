import { EventEmitter } from 'events';
import {  spawn } from 'child_process';

export const FfmpegErrors = {
    FFMPEG_NOT_FOUND: { name: 'FFMPEG_NOT_FOUND', message: 'ffmpeg executable not found', fatal: true },
    FFMPEG_UNEXPECTED_END: { name: 'FFMPEG_UNEXPECTED_END', message: 'ffmpeg a ended unexpectedly', fatal: true},
    FFMPEG_NOT_RUNNING: { name: 'FFMPEG_NOT_RUNNING', message: 'ffmpeg is not running yet', fatal: false },
    RTMP_CONNECTION_FAILED: {
      name: 'RTMP_CONNECTION_FAILED',
      message: 'connection to RTMP server failed',
      fatal: true
    },
  };



export default class Ffmpeg extends EventEmitter {
    // private options: FfmpegConfig;
    // private logger: Logger;
    // private process?: ChildProcessWithoutNullStreams;
    // private status: 'RUNNING' | 'ENDED' | 'ENDING' | 'CREATED' = 'CREATED';
    // private framesSent: number = 0;
    // private lastFrameSentTime?: number;
    // private lastOutput: string = "";

    constructor( options) {
      super();
      this.options = options;
      this.process = null
      this.status = null;
    }



  start() {
    this.process = spawn('ffmpeg', this.createOptions());

    this.process.stderr.on('data', (data) => this.onProcessOutput(data));
    this.process.stdout.on('data', (data) => this.onProcessOutput(data));

    this.process.stdin.on('error', (error) => this.onProcessStdinError(error));

    this.process.on('error', (err) => this.onProcessError(err));
    this.process.on('exit', () => {
        console.log('exit')
      if(this.status !== "ENDING") {
        // this.emit('error', {
        //   ...FfmpegErrors.FFMPEG_UNEXPECTED_END,
        //   details: `Last output: ${this.lastOutput}`
        // });
      }
    //   this.emit("destroyed");
      this.status = 'ENDED';
    });


    this.status = 'RUNNING';
    console.log('set status', this.status)
  }

  onProcessOutput(data) {
    const message = Buffer.from(data).toString('utf8');

    this.lastOutput = message;
    console.log('on process output', message)
    // this.logger.trace(message);

    // let match;
    // if (message.match(/(.*): Connection refused[\n]?/g)) {
    //   this.emitError({ ...FfmpegErrors.RTMP_CONNECTION_FAILED, details: message });
    //   // tslint:disable-next-line: no-conditional-assignment
    // } else if ((match = message.match(/frame=[\s]+([\d]+)[\s]+.*/))) {
    //   this.framesSent = parseInt(match[1], 10);
    //   this.lastFrameSentTime = new Date().getTime();
    //   this.emit('ffmpegOutput', message);
    // } else {
    //   this.emit('ffmpegOutput', message);
    // }
  }

   onProcessStdinError(err) {
    console.log('on process std in err', err)
    // if ((err).code === 'EPIPE' && this.status === "ENDING") {
    //   return;
    // }
    // this.emitError({
    //   ...err,
    //   name: "FFMPEG_ERROR",
    //   fatal: true
    // });
  }

   onProcessError(err) {
    console.log('on process error', err)
    // if ((err).code === 'EPIPE' && this.status === "ENDING") {
    //   return;
    // }
    // this.status = 'ENDED';
    // if ((err).code === 'ENOENT') {
    //   this.emitError(FfmpegErrors.FFMPEG_NOT_FOUND);
    // }
    // this.emitError({
    //   ...err,
    //   name: "FFMPEG_ERROR",
    //   fatal: true
    // });
  }

  destroy() {
    this.status = 'ENDING';
    this.process?.kill("SIGKILL");
  }

  sendData(data){
    return new Promise((resolve, reject) => {
      if (this.status !== 'RUNNING') {
        reject(FfmpegErrors.FFMPEG_NOT_RUNNING);
      }
      this.process?.stdin.write(data, (err) => {
        if(err) {
          if ((err).code === 'EPIPE' && this.status === "ENDING") {
            return;
          }
          reject({
            name: "FFMPEG_WRITE_ERROR",
            message: err.message
          });
        } else {
          resolve();
        }
      });
    });
  }

   getAudioEncoding(audioSampleRate){
    switch (audioSampleRate) {
      case 11025:
        return '11k';
      case 22050:
        return '22k';
      case 44100:
        return '44k';
      default:
        return '44k';
    }
  }

   createOptions(){
    const audioEncoding = this.getAudioEncoding(this.options.audioSampleRate);
    const keyintMin = String(Math.min(25, this.options.framerate));

    const options = [
    //   '-i',
    //   '-',
    //   '-c:v',
    //   'libx264',
    //   '-preset',
    //   'ultrafast',
    //   '-tune',
    //   'zerolatency',
    //   '-r',
    //   String(this.options.framerate),
    //   '-g',
    //   String(this.options.framerate * 2),
    //   '-keyint_min',
    //   keyintMin,
    //   '-crf',
    //   '25',
    //   '-pix_fmt',
    //   'yuv420p',
    //   '-sc_threshold',
    //   '0',
    //   '-profile:v',
    //   'main',
    //   '-level',
    //   '3.1',
    //   '-c:a',
    //   'aac',
    //   '-b:a',
    //   audioEncoding,
    //   '-ar',
    //   String(this.options.audioSampleRate),
    //   '-f',
    //   'flv',
    //   this.options.rtmp,
    "-framerate","30",
                         "-video_size","1920x1080",
                         "-i","/dev/video0",
                         "-f","mpegts",
                         "-codec:v","mpeg1video",
                         "-s","1920x1080",
                         "-b:v","3000k",
                         "qscale:v","20",
                         "-bf","0",
    this.options.rtmp,
    ];

    return options;
  }
}

export const sendData = (data) =>{
    return new Promise((resolve, reject) => {
      if (this.status !== 'RUNNING') {
        reject(FfmpegErrors.FFMPEG_NOT_RUNNING);
      }
      this.process?.stdin.write(data, (err) => {
        if(err) {
          if ((err).code === 'EPIPE' && this.status === "ENDING") {
            return;
          }
          reject({
            name: "FFMPEG_WRITE_ERROR",
            message: err.message
          });
        } else {
          resolve();
        }
      });
    });
  }



//  export const start = () => {
//     this.process = spawn('ffmpeg', this.createOptions());

//     this.process.stderr.on('data', (data) => this.onProcessOutput(data));
//     this.process.stdout.on('data', (data) => this.onProcessOutput(data));

//     this.process.stdin.on('error', (error) => this.onProcessStdinError(error));

//     this.process.on('error', (err) => this.onProcessError(err));
//     this.process.on('exit', (_) => {
//       if(this.status !== "ENDING") {
//         this.emit('error', {
//           ...FfmpegErrors.FFMPEG_UNEXPECTED_END,
//           details: `Last output: ${this.lastOutput}`
//         });
//       }
//       this.emit("destroyed");
//       this.status = 'ENDED';
//     });

//     this.status = 'RUNNING';
//   }

//   export const destroy = () =>{
//     this.status = 'ENDING';
//     this.process?.kill("SIGKILL");
//   }

//   export const  getStatus =() =>{
//     return {
//       status: this.status,
//       framesSent: this.framesSent,
//       lastFrameSentTime: this.lastFrameSentTime,
//       pid: this.process?.pid,
//       options: {
//         ...this.options
//       }
//     };
//   }

//   export const emitError = (error) => {
//     this.emit('error', error);
//   }

//   export const onProcessOutput = (data) => {
//     const message = Buffer.from(data).toString('utf8');

//     this.lastOutput = message;
//     this.logger.trace(message);

//     let match;
//     if (message.match(/(.*): Connection refused[\n]?/g)) {
//       this.emitError({ ...FfmpegErrors.RTMP_CONNECTION_FAILED, details: message });
//       // tslint:disable-next-line: no-conditional-assignment
//     } else if ((match = message.match(/frame=[\s]+([\d]+)[\s]+.*/))) {
//       this.framesSent = parseInt(match[1], 10);
//       this.lastFrameSentTime = new Date().getTime();
//       this.emit('ffmpegOutput', message);
//     } else {
//       this.emit('ffmpegOutput', message);
//     }
//   }

//   const  onProcessStdinError =(err) => {
//     if ((err).code === 'EPIPE' && this.status === "ENDING") {
//       return;
//     }
//     this.emitError({
//       ...err,
//       name: "FFMPEG_ERROR",
//       fatal: true
//     });
//   }

//   export const onProcessError = (err) => {
//     if ((err).code === 'EPIPE' && this.status === "ENDING") {
//       return;
//     }
//     this.status = 'ENDED';
//     if ((err).code === 'ENOENT') {
//       this.emitError(FfmpegErrors.FFMPEG_NOT_FOUND);
//     }
//     this.emitError({
//       ...err,
//       name: "FFMPEG_ERROR",
//       fatal: true
//     });
//   }

// export const getAudioEncoding = (audioSampleRate) =>{
//     switch (audioSampleRate) {
//       case 11025:
//         return '11k';
//       case 22050:
//         return '22k';
//       case 44100:
//         return '44k';
//       default:
//         return '44k';
//     }
//   }

// export const   createOptions = (defaultOptions)=>{
//     const audioEncoding = getAudioEncoding(defaultOptions.audioSampleRate);
//     const keyintMin = String(Math.min(25, defaultOptions.framerate));

//     const options = [
//       '-i',
//       '-',
//       '-c:v',
//       'libx264',
//       '-preset',
//       'ultrafast',
//       '-tune',
//       'zerolatency',
//       '-r',
//       String(defaultOptions.framerate),
//       '-g',
//       String(defaultOptions.framerate * 2),
//       '-keyint_min',
//       keyintMin,
//       '-crf',
//       '25',
//       '-pix_fmt',
//       'yuv420p',
//       '-sc_threshold',
//       '0',
//       '-profile:v',
//       'main',
//       '-level',
//       '3.1',
//       '-c:a',
//       'aac',
//       '-b:a',
//       audioEncoding,
//       '-ar',
//       String(defaultOptions.audioSampleRate),
//       '-f',
//       'flv',
//       defaultOptions.rtmp,
//     ];

//     return options;
//   }
