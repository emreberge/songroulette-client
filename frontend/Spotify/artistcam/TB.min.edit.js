/*!
 * OpenTok JavaScript Library v0.91.45
 * http://www.tokbox.com/
 *
 * Copyright (c) 2011 TokBox, Inc.
 *
 * Date: February 09 12:41:51 2012
 */

function getHostname() {
	return window.location.hostname;
}

// Instrumentation

TB = function() {

	//--------------------------------------
	// EVENT CLASSES
	//--------------------------------------

	function EventDispatcher() {
		this._listeners = {};

		this.addEventListener = function(type, listener) {
			if (!type) {
				throw new Error("EventDispatcher.addEventListener :: No type specified");
			}
			if (!listener) {
				throw new Error("EventDispatcher.addEventListener :: No listener function specified");
			}


			if (!this._listeners.hasOwnProperty(type)) {
				this._listeners[type] = new Array();
			}
			this.removeEventListener(type, listener); // You cannot have the same listener for the same type multiple times
			debug("TB.addEventListener(" + type + ")");
			this._listeners[type].push(listener);
		};

		this.removeEventListener = function(type, listener) {
			if (!type) {
				throw new Error("EventDispatcher.removeEventListener :: No type specified");
			}
			if (!listener) {
				throw new Error("EventDispatcher.removeEventListener :: No listener function specified");
			}

			debug("TB.removeEventListener(" + type + ")");
			if (this._listeners.hasOwnProperty(type)) {
				for (var i=0; i < this._listeners[type].length; i++) {
					if (this._listeners[type][i] == listener) {
						this._listeners[type].splice(i, 1);
						break;
					}
				};
			}
		};

		this.dispatchEvent = function(event) {
			if (!event) {
				throw new Error("EventDispatcher.dispatchEvent :: No event specified");
			}
			if (!event.type) {
				throw new Error("EventDispatcher.dispatchEvent :: Event has no type");
			}
			if (!event.target) {
				event.target = this;
			}

			if (this._listeners.hasOwnProperty(event.type)) {
				var listeners = this._listeners[event.type];

				if (listeners instanceof Array) {
					for (var i=0; i < listeners.length; i++) {
						var handler = createHandler(listeners[i], event);
						// We run this asynchronously so that it doesn't interfere with execution if an error happens
						// eg. multiple event handlers are added one has an error so the subsequent ones fail
						setTimeout(handler, 1);
					};
				} else {
					throw new Error("EventDispatcher.dispatchEvent :: Invalid object type in listeners");
				}
			}
		};
	}

	function Event (type, cancelable) {
		this.type = type;
		this.cancelable = cancelable ? cancelable : false;
		this.target;

		var defaultPrevented = false;

		this.preventDefault = function() {
			if (this.cancelable) {
				defaultPrevented = true;
			} else {
				warn("Event.preventDefault :: Trying to preventDefault on an Event that isn't cancelable");
			}
		};

		this.isDefaultPrevented = function() {
			return defaultPrevented;
		};
	}

	function ExceptionEvent (type, message, title, code) {
		this.superClass = Event;
		this.superClass(type);

		this.message = message;
		this.title = title;
		this.code = code;
	}

	function ConnectionEvent (type, connections, reason) {
		this.superClass = Event;
		this.superClass(type);

		this.connections = connections;
		this.reason = reason;
	}

	function StreamEvent (type, streams, reason, cancelable) {
		this.superClass = Event;
		this.superClass(type, cancelable);

		this.streams = streams;
		this.reason = reason;
	}

	function SessionConnectEvent (type, connections, streams, groups, archives) {
		this.superClass = Event;
		this.superClass(type);

		this.connections = connections;
		this.streams = streams;
		this.groups = groups;
		this.archives = archives;
	}

	function SessionDisconnectEvent (type, reason, cancelable) {
		this.superClass = Event;
		this.superClass(type, cancelable);

		this.reason = reason;
	}

	function SignalEvent (type, fromConnection) {
		this.superClass = Event;
		this.superClass(type);

		this.fromConnection = fromConnection;
	}

	function VolumeEvent(type, streamId, volume) {
	               this.superClass = Event;
	               this.superClass(type);
	
	               this.streamId = streamId;
				   this.volume = volume;
	}


	function DeviceEvent (type, camera, microphone) {
			this.superClass = Event;
			this.superClass(type);

			this.camera = camera;
			this.microphone = microphone;
		}

		function GroupEvent (type, group, reason) {
			this.superClass = Event;
			this.superClass(type);

			this.group = group;
			this.reason = reason;
		}

		function DeviceStatusEvent (type, cameras, microphones, selectedCamera, selectedMicrophone) {
			this.superClass = Event;
			this.superClass(type);

			this.cameras = cameras;
			this.microphones = microphones;
			this.selectedCamera = selectedCamera;
			this.selectedMicrophone = selectedMicrophone;
		}

		function ResizeEvent (type, widthFrom, widthTo, heightFrom, heightTo) {
			this.superClass = Event;
			this.superClass(type);

			this.widthFrom = widthFrom;
			this.widthTo = widthTo;
			this.heightFrom = heightFrom;
			this.heightTo = heightTo;
		}

	    function StreamPropertyChangedEvent(type, stream, changedProperty, oldValue, newValue) {
		this.superClass = Event;
		this.superClass(type);

		this.type = type;
		this.stream = stream;
		this.changedProperty = changedProperty;
		this.oldValue = oldValue;
		this.newValue = newValue;
	    }

		function ArchiveEvent (type, archives) {
			this.superClass = Event;
			this.superClass(type);

			this.archives = archives;
		}

		function ArchiveStreamEvent (type, archive, streams) {
			this.superClass = Event;
			this.superClass(type);

			this.archive = archive;
			this.streams = streams;
		}
		
		function StateChangedEvent(type, changedValues) {
			this.superClass = Event;
			this.superClass(type);
			this.changedValues = changedValues;
		}
		
	    function ChangeFailedEvent(type, reasonCode, reason, failedValues) {
		this.superClass = Event;
		this.superClass(type);
		
		this.reasonCode = reasonCode;
		this.reason = reason;
		this.failedValues = failedValues;
	    }

		//--------------------------------------
		// CLASSES
		//--------------------------------------

		function Connection (connectionId, creationTime, data) {
			this.connectionId = connectionId;
			this.creationTime = Number(creationTime);
			this.data = data;

			this.quality;
		}


	function Stream (streamId, connection, name, data, type, creationTime, hasAudio, hasVideo, orientation, sessionId, peerId, quality) {
        //INSTANCE VARIABLES
	    this.streamId = streamId;
	    this.connection = connection;
	    this.name = name;
	    this.data = data;
	    this.type = type;
	    this.creationTime = creationTime;
	    this.hasAudio = hasAudio;
	    this.hasVideo = hasVideo;
	    this.orientation = orientation;
	    this.peerId = peerId;
	    this.quality = quality;

			this.startRecording = function(archive) {
				debug("Stream.startRecording()");
				var controllerId = "controller_" + sessionId;
				archive = createdArchives[sessionId][archive.archiveId];
				if (!archive) {
						var errorMsg = "Stream.startRecording :: Archive not created.";
						error(errorMsg);
						throw new Error(errorMsg);
				}
				if (archive.type != TB.PER_STREAM) {
					errorMsg = "Stream.startRecording :: Trying to record per stream on a " + archive.type + " archive";
					error(errorMsg);
					throw new Error(errorMsg);
				}
				if (controllerId && this.connection && this.connection.connectionId) {
					try {
						var controller = document.getElementById(controllerId);
						controller.startRecordingStream(this.streamId, archive.archiveId);
						archive.recording = true;
					} catch(err) {
						errorMsg = "Stream.startRecording :: " + err;
						error(errorMsg);
						throw new Error(errorMsg);
					}
				} else {
					errorMsg = "Stream.startRecording :: Connection required to record an archive.";
					error(errorMsg);
					throw new Error(errorMsg);
				}
			};

			this.stopRecording = function(archive) {
				debug("Stream.stopRecording()");
				archive = createdArchives[sessionId][archive.archiveId];
				if (!archive) {
						var errorMsg = "Stream.stopRecording :: Archive not created.";
						error(errorMsg);
						throw new Error(errorMsg);
				}
				if (archive.type != TB.PER_STREAM) {
					errorMsg = "Stream.stopRecording :: Trying to stop recording per stream on a " + archive.type + " archive";
					error(errorMsg);
					throw new Error(errorMsg);
				}
				var controllerId = "controller_" + sessionId;
				if (controllerId && this.connection && this.connection.connectionId) {
					try {
						var controller = document.getElementById(controllerId);
						controller.stopRecordingStream(this.streamId, archive.archiveId);
					} catch(err) {
						errorMsg = "Stream.stopRecording :: " + err;
						error(errorMsg);
						throw new Error(errorMsg);
					}
				} else {
					errorMsg = "Stream.stopRecording :: Connection required to record an archive.";
					error(errorMsg);
					throw new Error(errorMsg);
				}
			};
		}

		function UIComponent (id, replacedDivId) {
			this.id = id;
			this.replacedDivId = replacedDivId;
			this.parentClass = EventDispatcher;
			this.parentClass();
		}
		
		function StylableComponent(id, replacedDivId) {
			this.uberClass = UIComponent;
			this.uberClass(id, replacedDivId);
			
			var componentStyles = ["showMicButton", "showSpeakerButton", "showSettingsButton", "showCameraToggleButton", "nameDisplayMode", "buttonDisplayMode", "showSaveButton", "showRecordButton", "showRecordStopButton", "showReRecordButton", "showPauseButton", "showPlayButton", "showPlayStopButton", "showStopButton", "backgroundImageURI", "showControlPanel", "showRecordCounter", "showPlayCounter", "showControlBar"];
			this.getStyle = function(key) {
				var component = document.getElementById(this.id);
				if (!this.loaded) {
					if (key) {
						return this._style[key];
					} else {
						return this._style;
					}
				} else if (component) {
					try {
						var style = component.getStyle(key);
						if (typeof(style) == "string")
							return style;
						for (var i in style) {
							if (style[i] == "false")
								style[i] = false;
							if (style[i] == "true")
								style[i] = true;
							if (componentStyles.indexOf(i) < 0) {
								// Strip unnecessary properties out
								delete style[i];
							}
						};
						return style;
					} catch (err) {
						var errorMsg = "Publisher.getStyle:: Failed to call getStyle. " + err;
						error(errorMsg);
						throw new Error(errorMsg);
					}
				} else {
					errorMsg = "Publisher.getStyle:: Publisher " + this.id + " does not exist.";
					error(errorMsg);
					throw new Error(errorMsg);
				}
			};
			
			this._style = {};
			var validStyleValues = {
				buttonDisplayMode: ["auto", "off", "on"],
				nameDisplayMode: ["auto", "off", "on"],
				showSettingsButton: [true, false],
				showMicButton: [true, false],
				showCameraToggleButton: [true, false],
				showSaveButton: [true, false],
				backgroundImageURI: null,
				showControlBar: [true, false],
				showPlayCounter: [true, false],
				showRecordCounter: [true, false]
			};
			this.setStyle = function(key, value) {
				debug("Publisher.setStyle: " + key.toString());
				var component = document.getElementById(this.id);
				if (!this.loaded) {
					if ((typeof(key) == "string") && value != null) {
						if (this._style.hasOwnProperty(key) && (key == "backgroundImageURI" || (validStyleValues[key].indexOf(value) > -1)) ) {
							debug("setStyle::Setting " + key + " to " + value);
							this._style[key] = value;
						} else {
							warn("setStyle::Invalid style property passed " + key + " : " + value);
						}
					} else {
						for (var i in key) {
							this.setStyle(i, key[i]);
						};
					}
					this.modified = true;
				} else if (component) {
					try {
						component.setStyle(key, value);
					} catch (err) {
						var errorMsg = "Publisher.setStyle:: Failed to call setStyle. " + err;
						error(errorMsg);
						throw new Error(errorMsg);
					}
				} else {
					errorMsg = "Publisher.setStyle:: Publisher " + this.id + " does not exist.";
					error(errorMsg);
					throw new Error(errorMsg);
				}
				
				return this;
			};
		}
		
		function VideoComponent(id, replacedDivId) {
			this.supClass = StylableComponent;
			this.supClass(id, replacedDivId);
			
			this.getImgData = function() {
				debug("VideoComponent.getImgData");

				var component = document.getElementById(this.id);
				if (component) {
					try {
						return component.getImgData();
					} catch(err) {
						var errorMsg = "VideoComponent.getImgData:: Failed to call getImgData. " + err;
						error(errorMsg);
						throw new Error(errorMsg);
					}
				} else {
					errorMsg = "VideoComponent.getImgData:: Component " + this.id + " does not exist.";
					error(errorMsg);
					throw new Error(errorMsg);
				}
			};
		}
		

		function Publisher (id, replacedDivId, properties) {
			this.superClass = VideoComponent;
			this.superClass(id, replacedDivId);
			this._style = {
				showMicButton: true,
				showSettingsButton: true,
				showCameraToggleButton: true,
				nameDisplayMode: "auto",
				buttonDisplayMode: "auto",
				backgroundImageURI: null
			};
			
			this.modified = false;

			if (properties && properties.hasOwnProperty("style")) {
				this.setStyle(properties['style']);
				this.modified = true;
			}

			this.properties = properties;
			this.loaded = false;
			this.panelId = null;
			this.gain = 50;

		if(properties && properties.hasOwnProperty("microphoneGain")) {
		    this.gain = parseInt(properties["microphoneGain"], 10);
		}
			
			this.enableMicrophone = function() {
				this.publishAudio(true);
			};
			this.disableMicrophone = function() {
				this.publishAudio(false);
			};
			this.setMicrophoneGain = function(value) {
				var component = document.getElementById(this.id);
				if (!this.loaded) {
					this.gain = value;
					this.modified = true;
				} else if (component) {
					try {
						component.setMicGain(value);
					} catch (err) {
						var errorMsg = "Microphone gain adjustment on publisher "+this.id+" failed";
						error(errorMsg);
						throw new Error(errorMsg);
					}
				} else {
					errorMsg = "Publisher "+ this.id + " does not exist.";
					error(errorMsg);
					throw new Error(errorMsg);
				}
				return this;
			};
			this.getMicrophoneGain = function() {
				var component = document.getElementById(this.id);
				if (!this.loaded) {
					return this.gain;
				} else if (component) {
					try {
						return component.getMicGain();
					} catch (err) {
						var errorMsg = "Microphone gain adjustment on publisher "+this.id+" failed";
						error(errorMsg);
						throw new Error(errorMsg);
					}
				} else {
					errorMsg = "Publisher "+ this.id + " does not exist.";
					error(errorMsg);
					throw new Error(errorMsg);
				}
			};
			this.getEchoCancellationMode = function() {
				debug("Publisher.getEchoCancellationMode()");

				var mode = "";
				var component = document.getElementById(this.id);
				if (!this.loaded) {
					return "unknown";
				} else if (component) {
					try {
						mode = component.getEchoCancellationMode();
					} catch (err) {
						var errorMsg = "Getting echo cancellation mode for publisher " + this.id + " failed. " + err;
						error(errorMsg);
						throw new Error(errorMsg);
					}
				} else {
					errorMsg = "Publisher "+ this.id + " does not exist.";
					error(errorMsg);
					throw new Error(errorMsg);
				}
				return mode;
			};
			this.publishAudio = function(publishAudioBool) {
				debug("Publisher.publishAudio()");
				if (!this.loaded) {
					this.audioPublished = publishAudioBool;
					this.modified = true;
				} else {
					setStreamProperty(this.id, "publishAudio", publishAudioBool);
				}
			};
			this.publishVideo = function(publishVideoBool) {
				debug("Publisher.publishVideo()");
				if (!this.loaded) {
					this.videoPublished = publishVideoBool;
					this.modified = true;
				} else {
					setStreamProperty(this.id, "publishVideo", publishVideoBool);
				}
			};
			this.setCamera = function(camera) {
				// Private function
				debug("Publisher.setCamera(" + camera + ")");
				setDevice(this.id, camera, true);
			};
			this.setMicrophone = function(microphone) {
				// Private function
				debug("Publisher.setMicrophone(" + microphone + ")");
				setDevice(this.id, microphone, false);
			};
		
		} 


		function Subscriber (stream, id, replacedDivId, properties) {
			this.superClass = VideoComponent;
			this.superClass(id, replacedDivId);
			this._style = {
				nameDisplayMode: "auto",
				buttonDisplayMode: "auto",
				backgroundImageURI: null
			};
			
			this.modified = false;

			if (properties && properties.hasOwnProperty("style")) {
				this.setStyle(properties['style']);
				this.modified = true;
			}

			this.stream = stream;
			this.properties = properties;
			this.loaded = false;
			this.audioVolume = 50;

		var _isAudioSubscribed = true;
		var _isVideoSubscribed = true;

		if(properties) {
		    if(properties.hasOwnProperty("subscribeToAudio") && (properties["subscribeToAudio"] == "false" || properties["subscribeToAudio"] == false)) {
			_isAudioSubscribed = false;
		    }

		    if(properties.hasOwnProperty("subscribeToVideo") && (properties["subscribeToVideo"] == "false" || properties["subscribeToVideo"] == false)) {
			_isVideoSubscribed = false;
		    }

		    if(properties.hasOwnProperty("audioVolume")) {
			this.audioVolume = parseInt(properties["audioVolume"], 10);
		    }
		}

			this.enableAudio = function() {
				this.subscribeToAudio(true);
			};
			this.disableAudio = function() {
				this.subscribeToAudio(false);
			};
			this.setAudioVolume = function(value) {
				var component = document.getElementById(this.id);
				if (!this.loaded) {
					this.audioVolume = value;
				} else if (component) {
					try {
						component.setAudioVolume(value);
					} catch (err) {
						var errorMsg = "Volume adjustment on subscriber "+this.id+" failed";
						error(errorMsg);
						throw new Error(errorMsg);
					}
				} else {
					errorMsg = "Subscriber "+ this.id + " does not exist.";
					error(errorMsg);
					throw new Error(errorMsg);
				}
				return this;
			};
			this.getAudioVolume = function() {
				var component = document.getElementById(this.id);
				if (!this.loaded) {
					return this.audioVolume;
				}
				if (component) {
					try {
						return component.getAudioVolume();
					} catch (err) {
						var errorMsg = "Volume adjustment on subscriber "+this.id+" failed";
						error(errorMsg);
						throw new Error(errorMsg);
					}
				} else {
					errorMsg = "Subscriber "+ this.id + " does not exist.";
					error(errorMsg);
					throw new Error(errorMsg);
				}
				return this;
			};

	/**
		 * Internal function to toggle the subscribeToAudio that respects
		 * the developer's state of subscribing
		 */
		this._subscribeToAudio = function(subscribeAudioBool, isTokBox) {
		    debug("Subscriber.subscribeToAudio()");
		    if(!isTokBox || _isAudioSubscribed) {
			if(!this.loaded) {
			    this.audioSubscribed = subscribeAudioBool;
			    this.modified = true;
			} else {
			    setStreamProperty(this.id, "subscribeToAudio", subscribeAudioBool);
			}
		    }
		};
		this.subscribeToAudio = function(subscribeAudioBool) {
		    _isAudioSubscribed = subscribeAudioBool;
		    this._subscribeToAudio(_isAudioSubscribed, false);
		};

		/**
		 * Internal function to toggle the subscribeToVideo that respects
		 * the developer's state of subscribing
		 */
		this._subscribeToVideo = function(subscribeVideoBool, isTokBox) {
		    debug("Subscriber.subscribeToVideo()");
		    if(!isTokBox || _isVideoSubscribed) {
			if(!this.loaded) {
			    this.videoSubscribed = subscribeVideoBool;
			    this.modified = true;
			} else {
			    setStreamProperty(this.id, "subscribeToVideo", subscribeVideoBool);
			}
		    }
		};
		this.subscribeToVideo = function(subscribeVideoBool) {
		    _isVideoSubscribed = subscribeVideoBool;
		    this._subscribeToVideo(_isVideoSubscribed, false);
		};

			this.changeOrientation = function(orientation) {
				// private function
				debug("Subscriber.changeOrientation()");
				setStreamProperty(this.id, "changeOrientation", orientation);
			};
		}

		function DevicePanel (id, replacedDivId, component, properties) {
			this.superClass = UIComponent;
			this.superClass(id, replacedDivId);

			if (component) {
				this.publisher = component;	//publisher is deprecated
				this.component = component;
			} else {
				this.publisher = null;
				this.component = component;
			}
			this.parentCreated = false;
			this.properties = properties;
		}

		function Camera (name, status) {
			this.name = name;
			this.status = status;
		}

		function Microphone (name, status) {
			this.name = name;
			this.status = status;
		}

		function Group (sessionId,groupId) {
			this.superClass = EventDispatcher;
			this.superClass();

			this.groupId = groupId;
			this.sessionId = sessionId;
			this.enableEchoSuppression = function() {
				debug("Group.enableEchoSuppresion()");
				setEchoSuppressionEnabled(this.sessionId, this.groupId, true);
			};
			this.disableEchoSuppression = function() {
				debug("Group.disableEchoSuppression()");
				setEchoSuppressionEnabled(this.sessionId, this.groupId, false);
			};

			this.getGroupProperties = function() {
				debug("Group.getGroupProperties()");
				return getGroupProperties(this.sessionId, this.groupId);
			};

		}

		function EchoSuppression(isEnabled){
		    this.isEnabled = isEnabled;
		}

		function Multiplexer(outputStreams,switchType,switchTimeout)
		{
		    this.numOutputStreams = outputStreams;
		    this.switchType = switchType;
		    this.switchTimeout = switchTimeout;
		}

		function GroupProperties(group) {
			this.echoSuppression = new EchoSuppression(group.echoSuppressionEnabled);
			this.multiplexer = new Multiplexer(group.multiplexerNumOutputStreams,group.multiplexerSwitchType,group.multiplexerSwitchTimeout);
		}

		function Archive (archiveId, type, title, sessionId, status) {
			this.archiveId = archiveId;
			this.type = type;
			this.title = title;
			this.sessionId = sessionId;
			var stateManager; 
			if (status == "sessionRecordingInProgress") {
				this.recording = true;
				this.status = "open";
			}
			else {
				this.recording = false;
				this.status = status;
			}

			this.startPlayback = function(loop) {
		        if (!loop) {
		            loop = false;
		        }
				debug("Archive.startPlayback() : " + loop);
				var controllerId = "controller_" + sessionId;
				var connection = TB.sessions[sessionId].connection;
				if (!loadedArchives[sessionId][this.archiveId]) {
						var errorMsg = "Archive.startPlayback :: Archive not loaded.";
						error(errorMsg);
						throw new Error(errorMsg);
				}
				if (controllerId && connection && connection.connectionId) {
					try {
						var controller = document.getElementById(controllerId);
						controller.startPlayback(this.archiveId, loop);
					} catch(err) {
						errorMsg = "Archive.startPlayback :: " + err;
						error(errorMsg);
						throw new Error(errorMsg);
					}
				} else {
					errorMsg = "Archive.startPlayback :: Connection required to play back an archive.";
					error(errorMsg);
					throw new Error(errorMsg);
				}
			};

			this.stopPlayback = function() {
				debug("Archive.stopPlayback()");
				var controllerId = "controller_" + sessionId;
				var connection = TB.sessions[sessionId].connection;
				if (controllerId && connection && connection.connectionId) {
					try {
						var controller = document.getElementById(controllerId);
						controller.stopPlayback(this.archiveId);
					} catch(err) {
						var errorMsg = "Archive.stopPlayback :: " + err;
						error(errorMsg);
						throw new Error(errorMsg);
					}
				} else {
					errorMsg = "Archive.stopPlayback :: Connection required to stop playing back an archive.";
					error(errorMsg);
					throw new Error(errorMsg);
				}
			};

			this.getStateManager = function() {
				debug("Archive.getStateManager() " + archiveId);
				
				if (stateManager) return stateManager;

				else {
					var controllerId = "controller_" + sessionId;
					var connection = TB.sessions[sessionId].connection;
					if (controllerId && connection && connection.connectionId) {
					stateManager = new StateManager(controllerId, archiveId);
						return stateManager;
					}
				}
				
				var errorMsg = "Archive.getStateManager :: Connection required to getStateManager. "
								+ "Make sure that this archive was loaded in a Session.";
				error(errorMsg);
				throw new Error(errorMsg);
			};
		}
		
		function Recorder(id, replacedDivId, properties) {
			this.superClass = VideoComponent;
			this.superClass(id, replacedDivId);
			
			this._style = {
				buttonDisplayMode: "auto",
                showCameraToggleButton: true,
                showControlBar: true,
                showMicButton: true,
                showPlayCounter: true,
                showRecordCounter: true,
                showSaveButton: true,
                showSettingsButton: true
			};
			
			this.id = id;
			this.properties = properties;
			
			this.saveArchive = function() {
				var recorderElement = document.getElementById(this.id);
				recorderElement.save();
			};
			
			this.setCamera = function(camera) {
				debug("Recorder.setCamera(" + camera + ")");
				setDevice(this.id, camera, true);
			};
			this.setMicrophone = function(microphone) {
				debug("Recorder.setMicrophone(" + microphone + ")");
				setDevice(this.id, microphone, false);
			};

			this.stopRecording = function() {
				recorderElement = document.getElementById(this.id);
				recorderElement.stopRecording();
			};

			this.startRecording = function(title) {
				recorderElement = document.getElementById(this.id);
				recorderElement.startRecording(title);
			};

			this.startPlaying = function() {
				debug("Recorder.startPlaying()");
				try {
					var recorderElement = document.getElementById(this.id);
					recorderElement.startPlaying();
				} catch(err) {
					var errorMsg = "Recorder.startPlaying :: " + err;
					error(errorMsg);
					throw new Error(errorMsg);
				}
			};

			this.stopPlaying = function() {
				debug("Recorder.stopPlaying()");
				try {
					var recorderElement = document.getElementById(this.id);
					recorderElement.stopPlaying();
				} catch(err) {
					var errorMsg = "Recorder.stopPlaying :: " + err;
					error(errorMsg);
					throw new Error(errorMsg);
				}
			};

			this.setTitle = function (title) {
				var component = document.getElementById(this.id);
				if (!this.loaded) {
					this._title = title;
					this.modified = true;
				} else if (component) {
					try {
						component.setTitle(title);
					} catch (err) {
						var errorMsg = "Setting archive title on Recorder "+this.id+" failed.";
						error(errorMsg);
						throw new Error(errorMsg);
					}
				} else {
					errorMsg = "Recorder "+ this.id + " does not exist.";
					error(errorMsg);
					throw new Error(errorMsg);
				}
			};

		}
		

		function Player(id, replacedDivId, properties) {
			this.superClass = VideoComponent;
			this.superClass(id, replacedDivId);
			
			this._style = {
				showPlayButton: true,
				showStopButton: true,
				showSpeakerButton: true
			};

			this.id = id;
			this.properties = properties;
			this.archiveId;

			this.loadArchive = function(archiveId) {
				if (archiveId) {
					if (this.loaded) {
						try {
							var player = document.getElementById(this.id);
							player.loadArchive(archiveId);
							this.archiveId = archiveId;
						} catch(err) {
							var errorMsg = "Player.loadArchive :: " + err;
							error(errorMsg);
							throw new Error(errorMsg);
						}
					} else {
						this._archiveId = archiveId;
					}
				} else {
					errorMsg = "Player.loadArchive :: Archive id required to load an archive.";
					error(errorMsg);
					throw new Error(errorMsg);
				}

			};

			this.play = function() {
				if (this.loaded) {
					try {
						var player = document.getElementById(this.id);
						player.startPlayback();
					} catch(err) {
						var errorMsg = "Player.play :: " + err;
						error(errorMsg);
						throw new Error(errorMsg);
					}
				} else {
					this._play = true;
				}
			};

			this.stop = function() {
				if (this.loaded) {
					try {
						var player = document.getElementById(this.id);
						player.stopPlayback();
					} catch(err) {
						var errorMsg = "Player.stop :: " + err;
						error(errorMsg);
						throw new Error(errorMsg);
					}
				} else {
					this._play = false;
				}
			};

			this.pause = function() {
				if (this.loaded) {
					try {
						var player = document.getElementById(this.id);
						player.pausePlayback();
					} catch(err) {
						var errorMsg = "Player.pause :: " + err;
						error(errorMsg);
						throw new Error(errorMsg);
					}
				} else {
					this._play = false;
				}
			};

		}

		function DeviceManager (apiKey) {
			this.superClass = EventDispatcher;
			this.superClass();

			this.apiKey = apiKey;

			this.panels = {};

			this.showMicSettings = true;
		this.showCamSettings = true;

			var DEVICE_PANEL_WIDTH = 360;
			var DEVICE_PANEL_HEIGHT = 270;
			var DEVICE_PANEL_WIDTH_NO_CHROME = 340;
			var DEVICE_PANEL_HEIGHT_NO_CHROME = 230;

			this.detectDevices = function() {
				debug("DeviceManager.detectDevices()");
				if (!deviceDetectorId) {
					var params = {};
					params.allowscriptaccess = "always";

					deviceDetectorId = "opentok_deviceDetector";
					var attributes = {};
					attributes.id = deviceDetectorId;

					var properties = {};

					swfobject.addDomLoadEvent(function() {
						var div = document.createElement('div');
						div.setAttribute('id', deviceDetectorId);
						div.style.display = "none";
						document.body.appendChild(div);

						swfobject.embedSWF(WIDGET_URL + "/v0.91.45.1384d59/flash/f_devicedetectorwidget.swf?partnerId="+apiKey, deviceDetectorId, 1, 1, "10.0.0", false, properties, params, attributes);
					});
				} else {
					try {
						var deviceDetector = document.getElementById(deviceDetectorId);
						deviceDetector.detectDevices();
					} catch(err) {
						error(err);
						throw new Error("DeviceManager.detectDevices() :: Failed to locate existing device detector " + err);
					}
				}
			};

			this.displayPanel = function(replaceElementId, component, properties) {
				debug("DeviceManager.displayPanel(" + replaceElementId + ")");

				var panelId;
				if (component) panelId = "displayPanel_" + component.id;
				else panelId = "displayPanel_global";

				// If this is a publisher update the panelId in the publisher object
				if (component && TB.sessions) {
					for (var i in TB.sessions) {
						if (TB.sessions[i].hasOwnProperty("publishers") && TB.sessions[i].publishers[component.id]) {
							TB.sessions[i].publishers[component.id].panelId = panelId;
						}
					}
				}

				var existingElement = document.getElementById(panelId);

				if (existingElement) {
					warn("DeviceManager.displayPanel :: there is already a device panel" + (component ? " for this component" : ""));
					return this.panels[panelId];
				}

				var parentCreated = false;
				var propertiesCopy = (properties) ? copyObject(properties) : {};
				var params = {};
				params.allowscriptaccess = "always";

				var width = DEVICE_PANEL_WIDTH;
				var height = DEVICE_PANEL_HEIGHT;
				if ("showCloseButton" in propertiesCopy) {
					if (propertiesCopy["showCloseButton"] == false) {
						width = DEVICE_PANEL_WIDTH_NO_CHROME;
						height = DEVICE_PANEL_HEIGHT_NO_CHROME;
					}
				} else {
					propertiesCopy["showCloseButton"] = true;
				}

		    if(!("showMicSettings" in propertiesCopy)) {
			propertiesCopy["showMicSettings"] = this.showMicSettings;
		    }

		    if(!("showCamSettings" in propertiesCopy)) {
			propertiesCopy["showCamSettings"] = this.showCamSettings;
		    }

				if(!replaceElementId) {
					// If they didn't specify a replaceElementId then we will create a new element
					replaceElementId = 'devicePanel_replace_div';
					var replaceDiv = document.createElement('div');
					replaceDiv.setAttribute('id', replaceElementId);

					var parentDiv = document.createElement('div');
					parentDiv.setAttribute('id', 'devicePanel_parent_' + (component ? component.id : 'global'));
					parentDiv.style.position = "absolute";

					var yOffset =  ("pageYOffset" in window && typeof( window.pageYOffset ) == 'number') ? window["pageYOffset"] : 
									(document.body && document.body.scrollTop) ? document.body.scrollTop :
									(document.documentElement && document.documentElement.scrollTop) ? document.documentElement.scrollTop :
									0;
					var winHeight = ("innerHeight" in window) ? window.innerHeight : 
									(document.documentElement && document.documentElement.offsetHeight) ? document.documentElement.offsetHeight :
									DEVICE_PANEL_HEIGHT;
					yOffset += (winHeight * 0.20); // 20% down the current screen

					parentDiv.style.top = yOffset + "px";
					parentDiv.style.left = "50%";
					parentDiv.style.width = width + "px";
					parentDiv.style.height = height + "px";
					parentDiv.style.marginLeft = (0 - width/2) + "px";
					parentDiv.style.marginTop = (0 - height/4) + "px";
					if ("zIndex" in propertiesCopy) {
						parentDiv.style.zIndex = propertiesCopy["zIndex"];
						delete propertiesCopy["zIndex"];
					} else {
						parentDiv.style.zIndex = highZ()+1;
					}
					document.body.appendChild(parentDiv);
					parentCreated = true;
					parentDiv.appendChild(replaceDiv);
		    }

				var replaceElement = document.getElementById(replaceElementId);
				if(!replaceElement) {
					var errorMsg = "DeviceManager.displayPanel :: replaceElementId does not exist in DOM.";
			error(errorMsg);
					throw new Error(errorMsg);
				}

				var devicePanel;
				if (this.panels[panelId]) this.removePanel(this.panels[panelId]);
				if (component) devicePanel = new DevicePanel(panelId, replaceElementId, component, propertiesCopy);
				else devicePanel = new DevicePanel(panelId, replaceElementId, null, propertiesCopy);

				devicePanel.parentCreated = parentCreated;
				this.panels[panelId] = devicePanel;

				var attributes = {};
				attributes.id = devicePanel.id;
				attributes.style = "outline:none;";

				propertiesCopy["devicePanelId"] = panelId;

				if (propertiesCopy.wmode) {
					params.wmode = propertiesCopy.wmode;
					delete propertiesCopy["wmode"];
				} else {
					params.wmode = "transparent";
				}

				embedSWF(WIDGET_URL + "/v0.91.45.1384d59/flash/f_devicewidget.swf?partnerId="+this.apiKey, replaceElementId, width, height, MIN_FLASH_VERSION, false, propertiesCopy, params, attributes);

				return devicePanel;
			};

			this.removePanel = function(devicePanel) {
				if (!devicePanel.hasOwnProperty("id")) {
					var errorMsg = "DeviceManager.removePanel :: invalid DevicePanel object";
					error(errorMsg);
					throw new Error(errorMsg);
				}

				debug("DeviceManager.removePanel(" + devicePanel.id + ")");

				var devicePanelElement = document.getElementById(devicePanel.id);
				if (!devicePanelElement) {
					errorMsg = "DeviceManager.removePanel :: DevicePanel does not exist in DOM";
					error(errorMsg);
					throw new Error(errorMsg);
				}
				var parentElement = devicePanelElement.parentNode;
				var parentCreated = devicePanel.parentCreated;

				for (var dp in this.panels) {
					if (this.panels[dp].hasOwnProperty("id") && dp == devicePanel.id) {
						var panel = this.panels[dp];
						unloadComponent(this.panels[dp]);
						delete this.panels[dp];

						var action = function() {
							if (panel.publisher && TB.sessions) {
								for (var i in TB.sessions) {
									if (TB.sessions[i].hasOwnProperty("disconnect") && TB.sessions[i].publishers[panel.publisher.id]) {
										TB.sessions[i].publishers[panel.publisher.id].panelId = null;
									}
								}
							}
						};

						// The event handler is called asynchronously after 2 milliseconds.
						setTimeout(action, 2);
					}
				}

				if (parentCreated) {
					// Remove the parent because we created it
					try {
						var parentNode = parentElement.parentNode;
						parentNode.removeChild(parentElement);
					} catch (err) {
						errorMsg = "Failed to clean up the parent of the device panel " + err;
						error(errorMsg);
						throw new Error(errorMsg);
					}
				}
			};

		}
		
		function RecorderManager (apiKey) {
			
			var recorderCount = 1;
			var playerCount = 1;

			this.recorders = {};
			this.players = {};
			this.apiKey = apiKey;
			
			var DEFAULT_WIDTH = 320;
			var DEFAULT_HEIGHT = 271;
			var CONTROL_BAR_HEIGHT = 31;
			
			this.displayRecorder = function(token, replaceElementId, properties) {
				
				if (!token) {
					errorMsg = "RecorderManager.displayRecorder :: Token required to displayRecorder";
				    error(errorMsg);
					throw new Error(errorMsg);
				}
				
				var recorderId = "recorder_" + apiKey + "_" + recorderCount++;
				
				var propertiesCopy = (properties) ? copyObject(properties) : {};
				propertiesCopy["token"] = token;
				propertiesCopy["partnerId"] = apiKey;
				propertiesCopy["recorderId"] = recorderId;
				
				if (propertiesCopy.hasOwnProperty("style")) {
					var showControlBar = propertiesCopy.style.showControlBar;
					propertiesCopy.style = encodeURIComponent(JSONify(propertiesCopy.style));
				}
				
				var params = {};
				params.allowscriptaccess = "always";
				if (propertiesCopy.wmode){
					params.wmode = propertiesCopy.wmode;
					delete propertiesCopy["wmode"];
				} else {
					params.wmode = "transparent";
				}
				
				var attributes = {};
				attributes.id = recorderId;
				attributes.style = "outline:none;";
				
				if (!propertiesCopy.width || isNaN(propertiesCopy.width)) {
					propertiesCopy.width = DEFAULT_WIDTH;
				}
				if (!propertiesCopy.height || isNaN(propertiesCopy.height)) {
					propertiesCopy.height = DEFAULT_HEIGHT;
					if (showControlBar == false) {
						propertiesCopy.height -= CONTROL_BAR_HEIGHT;
					}
				}
					
				var createReplaceElement = false;
				if (!replaceElementId) {
					// Create a new element for the publisher and append it to the body
					replaceElementId = "recorder_replace_" + recorderCount;
					createReplaceElement = true;
				}
				
				swfobject.addDomLoadEvent(function() {
					if (createReplaceElement) {
						var div = document.createElement('div');
						div.setAttribute('id', replaceElementId);
						document.body.appendChild(div);
					}
					
					embedSWF(WIDGET_URL + "/v0.91.45.1384d59/flash/f_recordwidget.swf?partnerId="+apiKey, replaceElementId, propertiesCopy.width, propertiesCopy.height, MIN_FLASH_VERSION, false, propertiesCopy, params, attributes);
				});
				
				this.recorders[recorderId] = new Recorder(recorderId, replaceElementId, propertiesCopy);
				
				return this.recorders[recorderId];
			};

			this.removeRecorder = function(recorder) {
				if (!recorder) {
					var errorMsg = "Session.removeRecorder :: recorder cannot be null";
					error(errorMsg);
					throw new Error(errorMsg);
				}
				debug("Session.removeRecorder(" + recorder.id + ")");

				unloadComponent(recorder);
				delete this.recorders[recorder.id];
			};

			this.displayPlayer = function(archiveId, token, replaceElementId, properties) {
				
				if (!archiveId) {
					errorMsg = "RecorderManager.displayPlayer :: Valid ArchiveId required";
				    error(errorMsg);
					throw new Error(errorMsg);
				}
				
				var playerId = "player_" + apiKey + "_" + playerCount++;
				
				var propertiesCopy = (properties) ? copyObject(properties) : {};
				propertiesCopy["token"] = token;
				propertiesCopy["archiveId"] = archiveId;
				propertiesCopy["partnerId"] = apiKey;
				propertiesCopy["playerId"] = playerId;

				if (propertiesCopy.hasOwnProperty("style")) {
					var showControlBar = propertiesCopy.style.showControlBar;
					propertiesCopy.style = encodeURIComponent(JSONify(propertiesCopy.style));
				}

				var params = {};
				params.allowscriptaccess = "always";
				if (propertiesCopy.wmode){
					params.wmode = propertiesCopy.wmode;
					delete propertiesCopy["wmode"];
				} else {
					params.wmode = "transparent";
				}
				
				var attributes = {};
				attributes.id = playerId;
				attributes.style = "outline:none;";
				
				if (!propertiesCopy.width || isNaN(propertiesCopy.width)) {
					propertiesCopy.width = DEFAULT_WIDTH;
				}
				if (!propertiesCopy.height || isNaN(propertiesCopy.height)) {
					propertiesCopy.height = DEFAULT_HEIGHT;
					if (showControlBar == false) {
						propertiesCopy.height -= CONTROL_BAR_HEIGHT;
					}
				}
				if (!propertiesCopy.autoPlay) {
					propertiesCopy.autoPlay = false;
				}
				var createReplaceElement = false;
				if (!replaceElementId) {
					// Create a new element for the player and append it to the body
					replaceElementId = "player_replace_" + playerCount;
					createReplaceElement = true;
				}
				
				swfobject.addDomLoadEvent(function() {
					if (createReplaceElement) {
						var div = document.createElement('div');
						div.setAttribute('id', replaceElementId);
						document.body.appendChild(div);
					}
					
					embedSWF(WIDGET_URL + "/v0.91.45.1384d59/flash/f_playerwidget.swf?partnerId="+apiKey, replaceElementId, propertiesCopy.width, propertiesCopy.height, MIN_FLASH_VERSION, false, propertiesCopy, params, attributes);
				});
				
				this.players[playerId] = new Player(playerId, replaceElementId, propertiesCopy);
				
				return this.players[playerId];
			};
			
			this.removePlayer = function(player) {
				if (!player) {
					var errorMsg = "Session.removePlayer :: player cannot be null";
					error(errorMsg);
					throw new Error(errorMsg);
		}
				debug("Session.removePlayer(" + player.id + ")");

				unloadComponent(player);
				delete this.players[player.id];
			};
			
		}

		function Session (sessionId) {
			this.superClass = EventDispatcher;
			this.superClass();

			this.sessionId = sessionId;
			this.connection;
			this.subscribers = {};
			this.publishers = {};
			this.apiKey;
			this.capabilities;
			this.connected = false;
			this.connecting = false;

			var publisherCount = 1;
			var subscriberCount = 1;
			var DEFAULT_WIDTH = 264;
			var DEFAULT_HEIGHT = 198;
			var controllerId;
			var stateManager;

			this.connect = function(apiKey, token, properties) {
				if (this.connecting) {
					warn("Session.connect :: Patience, please.");
					return;
				}

				debug("Session.connect(" + apiKey + ")");
				
				if (!TB.checkSystemRequirements()) {
					var errorMsg = "Session.connect :: Flash Player Version 10+ required";
					error(errorMsg);
					throw new Error(errorMsg);
				}
				if (!apiKey) {
					errorMsg = "Session.connect :: API key required to connect";
					error(errorMsg);
					throw new Error(errorMsg);
				}
				if (!token) {
					errorMsg = "Session.connect :: Token required to connect";
				    error(errorMsg);
					throw new Error(errorMsg);
				}
				if (this.connected) {
					warn("Session.connect :: Session already connected");
					return;
				}

				this.connecting = true;

				var propertiesCopy = (properties) ? copyObject(properties) : {};

				this.apiKey = apiKey;
				this.token = token;
				this.properties = properties;
				var params = {};
				params.allowscriptaccess = "always";
				if (propertiesCopy.wmode) {
				    params.wmode = propertiesCopy.wmode;
				    delete propertiesCopy["wmode"];
				}

				if (propertiesCopy.connectionData) {
					propertiesCopy.connectionData = encodeURIComponent(propertiesCopy.connectionData);
				}

				controllerId = "controller_" + this.sessionId;
				var attributes = {};
				attributes.id = controllerId;

				propertiesCopy["sessionId"] = this.sessionId;
				propertiesCopy["token"] = this.token;

				var replaceId = "replace_" + this.sessionId;
				swfobject.addDomLoadEvent(function() {
					var div = document.createElement('div');
					div.setAttribute('id', replaceId);
					div.style.display = "none";
					document.body.appendChild(div);
                    var nowDate = new Date();
			        propertiesCopy["startTime"] = nowDate.getTime();
					swfobject.embedSWF(WIDGET_URL + "/v0.91.45.1384d59/flash/f_controllerwidget.swf?partnerId="+apiKey, replaceId, 1, 1, MIN_FLASH_VERSION, false, propertiesCopy, params, attributes);
				});
				if (window.location.protocol == "file:") {
					setTimeout("TB.controllerLoadCheck()", 8000);
				}
			};

			this.disconnect = function() {
				debug("Session.disconnect()");

				if (!controllerId || this.connecting) {
					warn("Session.disconnect :: No connection to disconnect");
					return;
				}

				// Disconnect controller
				var controller = document.getElementById(controllerId);
				if (controller) {
					if (!isUnloading) {
						try {
							controller.cleanupView();

						} catch(e) {
								var errorMsg = "Session.disconnect :: Failed to disconnect - " + e;
								error(errorMsg);
								throw new Error(errorMsg);
						}
					}
				} else {
					warn("Session.disconnect :: No connection to disconnect");
				}
			};

			this.disconnectComponents = function() {
				debug("Session.disconnectComponents() - disconnecting publishers and subscribers");
				// As part of cleaning up connections, disconnect any publishers and subscribers

				for (var publisher in this.publishers) {
					if (this.publishers[publisher].hasOwnProperty("id"))
						disconnectComponent(this.publishers[publisher]);
				}

				for (var subscriber in this.subscribers) {
					if (this.subscribers[subscriber].hasOwnProperty("id"))
						disconnectComponent(this.subscribers[subscriber]);
				}
			};

			this.cleanup = function() {
				debug("Session.cleanup()");
				for (var publisher in this.publishers) {
					if (this.publishers[publisher].hasOwnProperty("id"))
						this.unpublish(this.publishers[publisher]);
				}
				for (var subscriber in this.subscribers) {
					if (this.subscribers[subscriber].hasOwnProperty("id"))
						this.unsubscribe(this.subscribers[subscriber]);
				}
			};

			this.cleanupConnection = function() {
				// private function
				debug("Session.cleanupConnection() - removing controller");
				this.connection = null;

				if (!controllerId) {
					warn("Session.cleanup :: No connection to clean up");
					return;
				}

				if (document.getElementById(controllerId)) {
					setTimeout(function() { removeSWF(controllerId, "TB.sessionDisconnected :: "); controllerId = null; }, 0); // must be asynchronous
				} else {
					warn("Session.cleanup :: No connection to clean up");
				}
			};


		this.publish = function(replaceElementId, properties) {
			debug("Session.publish(" + replaceElementId + "):" + properties);


			if (!this.connection || !this.connection.connectionId) {
				var errorMsg = "Session.publish :: Connection required to publish";
				error(errorMsg);
				throw new Error(errorMsg);
			}
			if (!replaceElementId) {
				// Create a new element for the publisher and append it to the body
				var div = document.createElement('div');
				replaceElementId = "publisher_replace_" + this.sessionId + "_" + publisherCount;
				div.setAttribute('id', replaceElementId);
				document.body.appendChild(div);
			}

			// Check the name & data properties for length
			var propertiesCopy = (properties) ? copyObject(properties) : {};

            if (propertiesCopy["name"] != undefined && propertiesCopy["name"].length > 1000) {
				errorMsg = "Session.publish :: name property longer than 1000 chars.";
	            error(errorMsg);
				throw new Error(errorMsg);
            }

            if (propertiesCopy["data"] != undefined && propertiesCopy["data"].length > 1000) {
				errorMsg = "Session.publish :: data property longer than 1000 chars.";
	            error(errorMsg);
				throw new Error(errorMsg);
            }

			var publisherId = "publisher_" + this.sessionId + "_" + publisherCount++;
			var publisher = new Publisher(publisherId, replaceElementId, propertiesCopy);
				return this._embedPublisher(publisher);
			};
			
			// This function is not intended for publish use, it is so that we can republish when someone clicks
			// the deny button
			this._embedPublisher = function (publisher) {			
				var replaceElement = document.getElementById(publisher.replacedDivId);
				if(!replaceElement) {
					errorMsg = "Session.publish :: replaceElementId does not exist in DOM.";
			    error(errorMsg);
					throw new Error(errorMsg);
				}

				var params = {};
				params.allowscriptaccess = "always";
				params.cameraSelected = cameraSelected;
			      
				if (publisher.properties.wmode){
					params.wmode = publisher.properties.wmode;
					delete publisher.properties["wmode"];
				} else {
					params.wmode = "transparent";
				}

				if (publisher.properties.hasOwnProperty("style")) {
					publisher.properties.style = encodeURIComponent(JSONify(publisher.properties.style));
				}

				var attributes = {};
				attributes.id = publisher.id;
				attributes.style = "outline:none;";

				publisher.properties["publisherId"] = publisher.id;
				publisher.properties["connectionId"] = this.connection.connectionId;
				publisher.properties["sessionId"] = this.sessionId;
				publisher.properties["token"] = this.token;
				publisher.properties["cameraSelected"] = cameraSelected;
				publisher.properties["simulateMobile"] = TB.simulateMobile;
				publisher.properties["publishCapability"] = this.capabilities.publish;
				
				if (!publisher.properties.width || isNaN(publisher.properties.width))
					publisher.properties.width = DEFAULT_WIDTH;
				if (!publisher.properties.height || isNaN(publisher.properties.height))
					publisher.properties.height = DEFAULT_HEIGHT;
				/**	if (!publisher.properties.encodedWidth || isNaN(publisher.properties.encodedWidth))
					publisher.properties.encodedWidth = DEFAULT_WIDTH;
				if (!publisher.properties.encodedHeight || isNaN(publisher.properties.encodedHeight))
					publisher.properties.encodedHeight = DEFAULT_HEIGHT;
				*/
				this.publishers[publisher.id] = publisher;
				var nowDate = new Date();
				publisher.properties["startTime"] = nowDate.getTime();
				embedSWF(WIDGET_URL + "/v0.91.45.1384d59/flash/f_publishwidget.swf?partnerId="+this.apiKey, publisher.replacedDivId, publisher.properties.width, publisher.properties.height, MIN_FLASH_VERSION, false, publisher.properties, params, attributes);

				return publisher;
			};
			

			this.unpublish = function(publisher) {
				if (!publisher) {
					var errorMsg = "Session.unpublish :: publisher cannot be null";
					error(errorMsg);
					throw new Error(errorMsg);
				}
				debug("Session.unpublish(" + publisher.id + ")");

				if (publisher.panelId && deviceManager && deviceManager.panels[publisher.panelId]) {
					deviceManager.removePanel(deviceManager.panels[publisher.panelId]);
				}

				unloadComponent(publisher);
				delete this.publishers[publisher.id];
			};

		this.forceUnpublish = function(stream) {
				var streamId;
				if (stream && typeof(stream) == "string") {
					streamId = stream;
		    } else if (stream && typeof(stream) == "object" && stream.hasOwnProperty("streamId")) {
					streamId = stream.streamId;
		    } else {
					var errorMsg = "Session.forceUnpublish :: Invalid stream type";
					error(errorMsg);
					throw new Error(errorMsg);
				}
				debug("Session.forceUnpublish(" + streamId + ")");

				if (streamId) {
					try {
						var controller = document.getElementById(controllerId);
						controller.forceUnpublish(streamId);
					} catch(err) {
						errorMsg = "Session.forceUnpublish :: "+ err;
						error(errorMsg);
						throw new Error(errorMsg);
					}
				} else {
					errorMsg = "Session.forceUnpublish :: Stream does not exist.";
					error(errorMsg);
					throw new Error(errorMsg);
				}
		};

			this.subscribe = function(stream, replaceElementId, properties) {
				if (!this.connection || !this.connection.connectionId) {
					var errorMsg = "Session.subscribe :: Connection required to subscribe";
					error(errorMsg);
					throw new Error(errorMsg);
				}

				if (!stream) {
					errorMsg = "Session.subscribe :: stream cannot be null";
					error(errorMsg);
					throw new Error(errorMsg);
				}
				if (!stream.hasOwnProperty("streamId")) {
					errorMsg = "Session.subscribe :: invalid stream object";
					error(errorMsg);
					throw new Error(errorMsg);
				}
				debug("Session.subscribe(" + stream.streamId + ")");

				if (!replaceElementId) {
					// Create a new element for the subscriber and append it to the body
					var div = document.createElement('div');
					replaceElementId = "subscriber_replace_" + this.sessionId + "_" + subscriberCount;
					div.setAttribute('id', replaceElementId);
					document.body.appendChild(div);
				}

				var replaceElement = document.getElementById(replaceElementId);
				if(!replaceElement) {
					errorMsg = "Session.subscribe :: replaceElementId does not exist in DOM.";
			error(errorMsg);
					throw new Error(errorMsg);
				}

				var propertiesCopy = (properties) ? copyObject(properties) : {};

				if( stream && stream.hasOwnProperty("type") && stream.type == "multiplexed") {
					propertiesCopy.mixedStreamURI = "live-lowlatency";
				}

				var subscriberId = "subscriber_" + stream.streamId + "_" + subscriberCount++;
				var subscriber = new Subscriber(stream, subscriberId, replaceElementId, propertiesCopy);

				var params = {};
				params.allowscriptaccess = "always";
				if (propertiesCopy.wmode){
					params.wmode = propertiesCopy.wmode;
					delete propertiesCopy["wmode"];
				} else {
					params.wmode = "transparent";
				}
				
				if (propertiesCopy.hasOwnProperty("style")) {
					propertiesCopy.style = encodeURIComponent(JSONify(propertiesCopy.style));
				}

				var attributes = {};
				attributes.id = subscriber.id;
				attributes.style = "outline:none;";

				propertiesCopy["subscriberId"] = subscriberId;
				propertiesCopy["connectionId"] = this.connection.connectionId;
				propertiesCopy["sessionId"] = this.sessionId;
				propertiesCopy["streamId"] = stream.streamId;
				propertiesCopy["streamType"] = stream.type;
				propertiesCopy["name"] = stream.name;
				propertiesCopy["token"] = this.token;
				propertiesCopy["simulateMobile"] = TB.simulateMobile;
				propertiesCopy["isPublishing"] = (Object.keys(this.publishers).length > 0);

		    if(!stream.hasAudio) {
			propertiesCopy["subscribeToAudio"] = "false";
		    }
		    if(!stream.hasVideo) {
			propertiesCopy["subscribeToVideo"] = "false";
		    }
				propertiesCopy["orientation"] = stream.orientation;
				propertiesCopy["peerId"] = stream.peerId;
				
				if (!propertiesCopy.width || isNaN(propertiesCopy.width))
					propertiesCopy.width = DEFAULT_WIDTH;
				if (!propertiesCopy.height || isNaN(propertiesCopy.height))
					propertiesCopy.height = DEFAULT_HEIGHT;

				this.subscribers[subscriber.id] = subscriber;

                var nowDate = new Date();
				propertiesCopy["startTime"] = nowDate.getTime();
				embedSWF(WIDGET_URL + "/v0.91.45.1384d59/flash/f_subscribewidget.swf?partnerId="+this.apiKey, replaceElementId, propertiesCopy.width, propertiesCopy.height, MIN_FLASH_VERSION, false, propertiesCopy, params, attributes);

				return subscriber;
			};

			this.unsubscribe = function(subscriber) {
				if (!subscriber) {
					var errorMsg = "Subscribe.unsubscribe :: subscriber cannot be null";
					error(errorMsg);
					throw new Error(errorMsg);
				}
				debug("Session.unsubscribe(" + subscriber.id + ")");

				unloadComponent(subscriber);
				delete this.subscribers[subscriber.id];
			};

			this.signal = function() {
				debug("Session.signal()");
				if (controllerId && this.connection && this.connection.connectionId) {
					try {
						var controller = document.getElementById(controllerId);
						controller.sendSignal();
					} catch(err) {
						var errorMsg = "Session.signal :: " + err;
						error(errorMsg);
						throw new Error(errorMsg);
					}
				} else {
					errorMsg = "Session.signal :: Connection required to signal.";
					error(errorMsg);
					throw new Error(errorMsg);
				}
			};


			this.forceDisconnect = function(connection) {
				if (connection) debug("Session.forceDisconnect(" + connection.connectionId + ")");
				var connectionId;
				if (connection && typeof(connection) == "string")
					connectionId = connection;
				else if (connection && typeof(connection) == "object" && connection.hasOwnProperty("connectionId"))
					connectionId = connection.connectionId;
				else {
					var errorMsg = "Session.forceDisconnect :: Invalid connection type";
					error(errorMsg);
					throw new Error(errorMsg);
				}

				if (controllerId && this.connection && this.connection.connectionId) {
					try {
						var controller = document.getElementById(controllerId);
						controller.forceDisconnect(connectionId);
					} catch(err) {
						errorMsg = "Session.forceDisconnect :: "+ err;
						error(errorMsg);
						throw new Error(errorMsg);
					}
				} else {
					errorMsg = "Session.forceDisconnect :: Connection required to forceDisconnect.";
					error(errorMsg);
					throw new Error(errorMsg);
				}
			};

			this.getSubscribersForStream = function(stream) {
				var res = null;
				if (!stream) {
					var errorMsg = "Session.getSubscribersForStream :: stream cannot be null";
					error(errorMsg);
					throw new Error(errorMsg);
				} else {
				    var streamId;
				if (typeof(stream) == "string") {
					streamId = stream;
				} else if (typeof(stream) == "object" && stream.hasOwnProperty("streamId")) {
					streamId = stream.streamId;
				} else {
						errorMsg = "Session.getSubscribersForStream :: Invalid stream type";
					error(errorMsg);
						throw new Error(errorMsg);
				    }

				res = [];
				for (var sr in this.subscribers) {
				    if (this.subscribers[sr].hasOwnProperty("stream") && this.subscribers[sr].stream.streamId == streamId)
						res.push(this.subscribers[sr]);
				    }
				}

				return res;
			};

			this.getPublisherForStream = function(stream) {
				if (!stream) {
					var errorMsg = "Session.getPublisherForStream :: stream cannot be null";
					error(errorMsg);
					throw new Error(errorMsg);
				} else {
				    var streamId;
				if (typeof(stream) == "string") {
					streamId = stream;
				} else if (typeof(stream) == "object" && stream.hasOwnProperty("streamId")) {
					streamId = stream.streamId;
				} else {
						errorMsg = "Session.getPublisherForStream :: Invalid stream type";
					error(errorMsg);
						throw new Error(errorMsg);
				    }

				for (var pub in this.publishers) {
						var publisher = document.getElementById(this.publishers[pub].id);
						if (publisher) {
							try {
								if (publisher.getStreamId() == streamId) return this.publishers[pub];
							} catch (err) {
								warn("Failed to get streamId for publisher: " + this.publishers[pub].id);
							}
						}
				    }
				}

				return null;
			};

			this.createArchive = function(apiKey, type, title) {
				debug("Session.createArchive()");
				if (controllerId && this.connection && this.connection.connectionId) {
					if (type == TB.PER_SESSION || type == TB.PER_STREAM) {
						try {
							var controller = document.getElementById(controllerId);
							controller.createArchive(apiKey, type, title);
						} catch(err) {
							errorMsg = "Session.createArchive :: " + err;
							error(errorMsg);
							throw new Error(errorMsg);
						}
					} else {
						errorMsg = "Session.createArchive :: Invalid type specfied.";
						error(errorMsg);
						throw new Error(errorMsg);
					}
				} else {
					errorMsg = "Session.createArchive :: Connection required to create an archive.";
					error(errorMsg);
					throw new Error(errorMsg);
				}
			};

			this.loadArchive = function(archiveId) {
				debug("Session.loadArchive()");
				if (controllerId && this.connection && this.connection.connectionId) {
					try {
						var controller = document.getElementById(controllerId);
						controller.loadArchive(archiveId);
					} catch(err) {
						var errorMsg = "Session.loadArchive :: " + err;
						error(errorMsg);
						throw new Error(errorMsg);
					}
				} else {
					errorMsg = "Session.loadArchive :: Connection required to load an archive.";
					error(errorMsg);
					throw new Error(errorMsg);
				}
			};

			this.startRecording = function(archive) {
				debug("Session.startRecording()");
				archive = createdArchives[this.sessionId][archive.archiveId];
				if (!archive) {
					var errorMsg = "Session.startRecording :: Archive not created.";
					error(errorMsg);
					throw new Error(errorMsg);
				}
				if (archive.type != TB.PER_SESSION) {
					errorMsg = "Session.startRecording :: Trying to record per session on a " + archive.type + " archive";
					error(errorMsg);
					throw new Error(errorMsg);
				}
				if (archive.recording) {
					warn("Session.startRecording :: Trying to start recording when the archive is already recording");
					return;
				}
				if (controllerId && this.connection && this.connection.connectionId) {
					try {
						var controller = document.getElementById(controllerId);
						controller.startRecordingSession(archive.archiveId);
						archive.recording = true;
					} catch(err) {
						errorMsg = "Session.startRecording :: " + err;
						error(errorMsg);
						throw new Error(errorMsg);
					}
				} else {
					errorMsg = "Session.startRecording :: Connection required to record an archive.";
					error(errorMsg);
					throw new Error(errorMsg);
				}
			};

			this.stopRecording = function(archive) {
				debug("Session.stopRecording()");
				archive = createdArchives[this.sessionId][archive.archiveId];
				if (!archive) {
					var errorMsg = "Session.stopRecording :: Archive not created.";
					error(errorMsg);
					throw new Error(errorMsg);
				}
				if (archive.type != TB.PER_SESSION) {
					errorMsg = "Session.stopRecording :: Trying to stop recording per session on a " + archive.type + " archive";
					error(errorMsg);
					throw new Error(errorMsg);
				}
				if (controllerId && this.connection && this.connection.connectionId) {
					try {
						var controller = document.getElementById(controllerId);
						controller.stopRecordingSession(archive.archiveId);
						archive.recording = false;
					} catch(err) {
						errorMsg = "Session.stopRecording :: " + err;
						error(errorMsg);
						throw new Error(errorMsg);
					}
				} else {
					errorMsg = "Session.stopRecording :: Connection required to record an archive.";
					error(errorMsg);
					throw new Error(errorMsg);
				}
			};

			this.closeArchive = function(archive) {
				debug("Session.closeArchive()");
				if (controllerId && this.connection && this.connection.connectionId) {
					try {
						var controller = document.getElementById(controllerId);
						controller.closeArchive(archive.archiveId);
					} catch(err) {
						var errorMsg = "Session.closeArchive :: " + err;
						error(errorMsg);
						throw new Error(errorMsg);
					}
				} else {
					errorMsg = "Session.closeArchive :: Connection required to close an archive.";
					error(errorMsg);
					throw new Error(errorMsg);
				}
			};
			
			this.getStateManager = function() {
				debug("Session.getStateManager()");
				
				if (stateManager) return stateManager;
				else if (controllerId && this.connection && this.connection.connectionId) {
				    stateManager = new StateManager(controllerId);
					return stateManager;
				}
				
				var errorMsg = "Session.getStateManager :: Connection required to getState. Wait for sessionConnected before you getStateManager.";
				error(errorMsg);
				throw new Error(errorMsg);
			};
		}
		
		function StateManager(controllerId, archiveId) {
		    this.superClass = EventDispatcher;
		    this.superClass();
		    
		    var MAX_KEYS = 20;
			
			this.archiveId = archiveId;

			this.set = function(key, value) {
			    var values = key;
				if (archiveId) {
				  var errorMsg = "StateManager.set :: not allowed on StateManager objects for archives.";
				  error(errorMsg);
				  throw new Error(errorMsg);
				}
			    if (typeof(key) == "string" && (typeof(value) == "string" || value == null)) {
					values = {};
					values[key] = value;
			    } else if (typeof(key) == "object" && value == null) {
					if (Object.keys(values).length > MAX_KEYS) {
					    error("StateManager.set :: Maximum number of keys exceeded");
						this.dispatchEvent(new ChangeFailedEvent("changeFailed", 405, "Maximum number of keys exceeded", values));
						return;
					}
			    } else {
					errorMsg = "StateManager.set :: Invalid parameters passed. set() takes either two string parameters or one object of key value pairs.";
					error(errorMsg);
					throw new Error(errorMsg);
			    }
			    
			    for (var k in values) {
					if (typeof(values[k]) != "string" && values[k] != null) {
					    error("StateManager.set :: Invalid value " + values[k].toString() + " is not a string");
					    this.dispatchEvent(new ChangeFailedEvent("changeFailed", 403, " Invalid value, value must be a string", values));
					    return;
					}
			    };
			    
			    if (controllerId) {
					try {
					  var controller = document.getElementById(controllerId);
					  controller.setState(values);
					} catch (err) {
					  errorMsg = "StateManager.set :: " + err;
					  error(errorMsg);
					  throw new Error(errorMsg);
					}
			    }
			};
			
			this.superAddEventListener = this.addEventListener;
			this.addEventListener = function(type, listener) {
			    var key = false;
				if (type == "changed") {
					key = null;
				} else if (type.indexOf("changed:") == 0) {
					// Tell the controller which keys we want to subscribe to
					key = type.split(":")[1];
				}
				
				if (key !== false) {
					if (archiveId) {
						key = "TB_archive_" + archiveId + "_";
					}
				    // Tell the controller that we want to subscribe to all keys
					if (controllerId) {
						try {
							var controller = document.getElementById(controllerId);
							controller.subscribeToKeyChange(key);
						} catch(err) {
							var errorMsg = "StateManager.addEventListener :: " + err;
							error(errorMsg);
							throw new Error(errorMsg);
						}
					}
				}
				
				this.superAddEventListener(type, listener);
			};
			
			// Need to figure out how to know whether there are any event listeners for a key
			// if there are none then we can stop listening on the shared object, otherwise we should
			// keep listening.
		// this.superRemoveEventListener = this.removeEventListener;
		// this.removeEventListener = function(type, listener) {
		//     var key = false;
		//  if (type == "changed") {
		//                 key = null;
		//  } else if (type.indexOf("changed:") == 0) {
		//      // Tell the controller which keys we want to subscribe to
		//                 key = type.split(":")[1];
		//  }
		//  
		//  if (key !== false) {
		//      // Tell the controller that we want to subscribe to all keys
		//      if (controllerId) {
		//                  try {
		//                      var controller = document.getElementById(controllerId);
		//                      controller.unsubscribeFromKeyChange(key);
		//                  } catch(err) {
		//                      var errorMsg = "StateManager.removeEventListener :: " + err;
		//                      error(errorMsg);
		//                      throw new Error(errorMsg);
		//                  }
		//              }
		//  }
		//     
		//     this.superRemoveEventListener(type, listener);
		// };
		}
		

		//--------------------------------------
		//  PRIVATE HELPER FUNCTIONS
		//--------------------------------------	

		function setEchoSuppressionEnabled(sessionId, groupId, isEnabled) {
			try {
				var controller = document.getElementById("controller_" + sessionId);
				controller.setEchoSuppressionEnabled(groupId, isEnabled);
			} catch(err) {
				var errorMsg = "Group :: " + err;
				error(errorMsg);
				throw new Error(errorMsg);
			}
		}

		function getGroupProperties(sessionId, groupId) {
			var groupProperties = null;
			try {
				var controller = document.getElementById("controller_" + sessionId);
				var groupObject = controller.getGroupProperties(groupId);

				groupProperties = new GroupProperties(groupObject);
			} catch(err) {
				var errorMsg = "Group :: " + err;
				error(errorMsg);
				throw new Error(errorMsg);
			}

			return groupProperties;
		}

		function embedCallback (event) {
			if (!event.success) {
				error("Failed to embed SWF " + event.id);
				TB.exceptionHandler("Failed to embed SWF " + event.id, "Embed Failed", 2001);
			}
		}

		function embedSWF(swfUrlStr, replaceElemIdStr, widthStr, heightStr, swfVersionStr, xiSwfUrlStr, flashvarsObj, parObj, attObj) {
			if (!swfobject.hasFlashPlayerVersion(swfVersionStr)) {
				error("Flash Player " + swfVersionStr + " or higher required");
				TB.exceptionHandler("Flash Player " + swfVersionStr + " or higher required", "Embed Failed", 2001);
				return;
			}

			swfobject.embedSWF(swfUrlStr, replaceElemIdStr, widthStr, heightStr, swfVersionStr, xiSwfUrlStr, flashvarsObj, parObj, attObj, embedCallback);
		}

		function createHandler(func, event) {
			return function() {
				if(func != null) {
					func(event);
				} else {
					error('Event handler is null');
				}
			};
	    }

		function flashdebug (str) {
			window.opentokdebug.debug("[FLASHDEBUG] opentok: " + str);
		}

		function debug (str) {
			window.opentokdebug.debug("[DEBUG] opentok: " + str);
		}

		function info (str) {
			window.opentokdebug.info("[INFO] opentok: " + str);
		}

		function warn (str) {
			window.opentokdebug.warn("[WARN] opentok: " + str);
		}

	    function error (str) {
			window.opentokdebug.error("[ERROR] opentok: " + str);
		}

		function traceOut (level, str) {
			var element = document.getElementById('opentok_console');
			if (element) element.innerHTML += (str + '<br>');
		}
		
		function getConnectionFromConnectionId (connectionId) {
			if (connectionMap.hasOwnProperty(connectionId)) {
				var connection = connectionMap[connectionId];
			} else {
				connection = new Connection(connectionId, NaN, null);
			}
			return connection;
		}
		
		function getStream(streamObject, sessionId) {
		    return new Stream(streamObject.streamId, getConnectionFromConnectionId(streamObject.connectionId), streamObject.name, streamObject.streamData, streamObject.type, streamObject.creationTime, streamObject.hasAudio, streamObject.hasVideo, streamObject.orientation, sessionId, streamObject.peerId, streamObject.quality);
		}	

		function getStreams (streamObjects, sessionId) {
			var streams = [];
			for (var i=0; i < streamObjects.length; i++) {
				streams.push(getStream(streamObjects[i], sessionId));
			}

			return streams;
		}
		
		function getArchive (archive, sessionId) {
			var newArchive = new Archive(archive.id, archive.type, archive.title, sessionId, archive.status);
			if (!createdArchives.hasOwnProperty(sessionId)) createdArchives[sessionId] = {};
			createdArchives[sessionId][archive.id] = newArchive;
			
			return newArchive;
		}

		function getConnections (connectionObjects) {
			var connections = [];

			for (var i=0; i < connectionObjects.length; i++) {
				var connection = new Connection(connectionObjects[i].connectionId, connectionObjects[i].creationTime, connectionObjects[i].data);
			    connections.push(connection);
			
				connectionMap[connection.connectionId] = connection;
			};

			return connections;
		}

		function getGroups (sessionId,groupObjects) {
			var groups = [];
			for (var key in groupObjects) {
				if (groupObjects[key].hasOwnProperty("groupId"))
				    groups.push(new Group(sessionId,groupObjects[key].groupId));
			}

			return groups;
		}

		function getCamera (cameraObj) {
			if (cameraObj.status == TB.ACTIVE) {
				return new Camera(cameraObj.name, TB.ACTIVE);
			} else if (cameraObj.status == TB.INACTIVE) {
				return new Camera(cameraObj.name, TB.INACTIVE);
			} else {
				return new Camera(cameraObj.name, TB.UNKNOWN);
			}
		}

		function getMicrophone (microphoneObj) {
			return new Microphone(microphoneObj.name, microphoneObj.status);
		}

		function getCameras (cameraObjects) {
			var cameras = new Array();

			for (var i=0; i < cameraObjects.length; i++) {
				cameras.push(new Camera(cameraObjects[i].name, cameraObjects[i].status));
			};

			return cameras;
		}

		function getMicrophones (microphoneObjects) {
			var microphones = new Array();

			for (var i=0; i < microphoneObjects.length; i++) {
				microphones.push(new Microphone(microphoneObjects[i].name, microphoneObjects[i].status));
			};

			return microphones;
		}

		function disconnectComponent(component) {
			if(!component.hasOwnProperty("id")){
				return;
			}
			var uicomponent = document.getElementById(component.id);

			if (uicomponent) {
				try {
					uicomponent.cleanupView();
				} catch(e) {
					warn("Disconnecting " + component.id + " failed");
				}
			} else {
				warn("Disconnecting " + component.id + " failed");
			}
		}

		function unloadComponent (component) {
			var uicomponent = document.getElementById(component.id);
			if (uicomponent) {
				try {
					uicomponent.cleanupView();

					var parentNode = uicomponent.parentNode;
					parentNode.removeChild(uicomponent);
				} catch(e) {
					warn("Removing " + component.id + " failed " + e);
				}
			} else {
				warn("Element " + component.id + " does not exist");
			}
		}

		function removeSWF (componentId, message) {
			try {
				if (componentId) {
					swfobject.removeSWF(componentId);
					componentId = null;
				}
			} catch(err) {
				var errorMsg = message + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		}

		function setStreamProperty (id, property, value) {
			var component = document.getElementById(id);
			if (component) {
				try {
					component.setStreamProperty(property, value);
				} catch (err) {
					var errorMsg = "Changing settings on component " + id + " failed.";
					error(errorMsg);
					throw new Error(errorMsg);
				}
			} else {
				errorMsg = "Component "+id + " does not exist.";
				error(errorMsg);
				throw new Error(errorMsg);
			}
		}

		function setDevice (id, device, isCamera) {
			var component = document.getElementById(id);
			if (component) {
				try {
					if (isCamera) component.setCamera(device.name);
					else component.setMicrophone(device.name);
				} catch (err) {
					var errorMsg = "Changing hardware settings on publisher " + id + " failed.";
					error(errorMsg);
					throw new Error(errorMsg);
				}
			} else {
				errorMsg = "Publisher "+ id + " does not exist.";
				error(errorMsg);
				throw new Error(errorMsg);
			}
		}

		// Find highest Z-index - via StackOverflow <http://bit.ly/dFaOw9>
		function highZ(parent, limit){
			limit = limit || Infinity;
			parent = parent || document.body;
			var who, temp, max= 1, A= [], i= 0;
			var children = parent.childNodes, length = children.length;
			while(i<length){
				who = children[i++];
				if (who.nodeType != 1) continue;
				if (deepCss(who,"position") !== "static") { // element nodes only
					temp = deepCss(who,"z-index");
					if (temp == "auto") { // z-index is auto, so not a new stacking context
						temp = highZ(who);
					} else {
						temp = parseInt(temp, 10) || 0;
					}
				} else { // non-positioned element, so not a new stacking context
					temp = highZ(who);
				}
				if (temp > max && temp <= limit) max = temp;
			}
			return max;
		}

		// This function is only intended for highZ(). Other uses may be unpredictable.
		function deepCss(who, css) {
			var sty, val, dv= document.defaultView || window;
			if (who.nodeType == 1) {
				sty = css.replace(/\-([a-z])/g, function(a, b){
					return b.toUpperCase();
				});
				val = who.style[sty];
				if (!val) {
					if(who.currentStyle) val= who.currentStyle[sty];
					else if (dv.getComputedStyle) {
						val= dv.getComputedStyle(who,"").getPropertyValue(css);
					}
				}
			}
			return val || "";
		}

		function createHiddenElement (form, key, value) {
			var hiddenField = document.createElement("input");
			hiddenField.setAttribute("name", key);
			hiddenField.setAttribute("value", value);
			hiddenField.setAttribute("type", "hidden");
			form.appendChild(hiddenField);
		}

		function getDataForUIComponent (componentId) {
			try {
				var element = document.getElementById(componentId);
				if (element) {
					return element.fetchData();
				}
			} catch (err) {
				warn("Failed to get logs for " + componentId + " " + err);
				return "";
			}
		}
		
		function JSONify(object) {
			// JSONify the style property
			var styleString = "{ ";
			for (var key in object) {
				if (typeof(object[key]) == "boolean")
					styleString += '"' + key + '":' + object[key] + ', ';
				else 
					styleString += '"' + key + '":"' + object[key].toString() + '", ';
			};
			if (styleString.length > 1) {
				styleString = styleString.substring(0, styleString.length - 2) + " }";
			} else {
				styleString = "{}";
			}
			
			return styleString;
		}
		
		function copyObject(obj) {
			var newObj = (obj instanceof Array) ? [] : {};
			for (var i in obj) {
				if (i == 'clone') continue;
				if (obj[i] && typeof obj[i] == "object") {
					newObj[i] = copyObject(obj[i]);
				} else newObj[i] = obj[i];
			}
			return newObj;
		}


		//--------------------------------------
		//  EVENT HANDLERS
		//--------------------------------------

		this.isUnloading = false;
		window.onunload = function() {
			isUnloading = true;
			for (var i in TB.sessions) {
				if (TB.sessions[i].hasOwnProperty("disconnect")) {
					// Stop sessionDisconnectedHandler from happening. Was causing crashes on Safari.
					// We are just doing all the cleanup now.
					TB.sessionDisconnectedHandler = function() {};

					TB.sessions[i].disconnect();
					TB.sessions[i].cleanupConnection();
					TB.sessions[i].cleanup();
				}
			}
		};


		//--------------------------------------
		//  PRIVATE STATIC VARIABLES
		//--------------------------------------

		var MIN_FLASH_VERSION = "10.0.0";

		// Minimum width and height to fit the adobe settings UI
		var MIN_ADOBE_WIDTH = 215;
		var MIN_ADOBE_HEIGHT = 138;

		var deviceManager;
		var recorderManager;
		var deviceDetectorId;
		var cameraSelected = false;
		var showingIssueForm = false;
				
		var connectionMap = {};
		
		var SUPPORT_SSL = "true";
		
		var WIDGET_URL = "http://staging.tokbox.com";
		
		if (SUPPORT_SSL == "true" && window.location.protocol == "https:") {
			WIDGET_URL = "https://staging.tokbox.com";
		}
		
		var dispatcher = new EventDispatcher();
		var createdArchives = {};
		var loadedArchives = {};

		var controllerLoaded = false;

		return {

			//--------------------------------------
			//  TB PUBLIC STATIC VARIABLES
			//--------------------------------------

			sessions: {},
			groups: {},

			LOG:      5,
			DEBUG:    4,
			INFO:     3,
			WARN:     2,
			ERROR:    1,
			NONE:     0,

			// Activity Status for cams/mics
			ACTIVE: "active",
			INACTIVE: "inactive",
			UNKNOWN: "unknown",

			// Archive types
			PER_SESSION: "perSession",
			PER_STREAM: "perStream",

			// TB Events
			EXCEPTION: "exception",

			// Session Events
			SESSION_CONNECTED: "sessionConnected",
			SESSION_DISCONNECTED: "sessionDisconnected",
			STREAM_CREATED: "streamCreated",
			STREAM_DESTROYED: "streamDestroyed",
			CONNECTION_CREATED: "connectionCreated",
			CONNECTION_DESTROYED: "connectionDestroyed",
			SIGNAL_RECEIVED: "signalReceived",
			STREAM_PROPERTY_CHANGED: "streamPropertyChanged",
			MICROPHONE_LEVEL_CHANGED: "microphoneLevelChanged",
			ARCHIVE_CREATED: "archiveCreated",
			ARCHIVE_CLOSED: "archiveClosed",
			ARCHIVE_LOADED: "archiveLoaded",
			ARCHIVE_SAVED: "archiveSaved",
			SESSION_RECORDING_STARTED: "sessionRecordingStarted",
			SESSION_RECORDING_STOPPED: "sessionRecordingStopped",
			SESSION_RECORDING_IN_PROGRESS: "sessionRecordingInProgress",
			STREAM_RECORDING_IN_PROGRESS: "streamRecordingInProgress",
			SESSION_NOT_RECORDING: "sessionNotRecording",
			STREAM_RECORDING_STARTED: "streamRecordingStarted",
			STREAM_RECORDING_STOPPED: "streamRecordingStopped",
			PLAYBACK_STARTED: "playbackStarted",
			PLAYBACK_STOPPED: "playbackStopped",
			RECORDING_STARTED: "recordingStarted",
			RECORDING_STOPPED: "recordingStopped",
			// Group Events
			GROUP_PROPERTIES_UPDATED: "groupPropertiesUpdated",

			// Publisher Events
			RESIZE: "resize",
			SETTINGS_BUTTON_CLICK: "settingsButtonClick",
			DEVICE_INACTIVE: "deviceInactive",
			ACCESS_ALLOWED: "accessAllowed",
			ACCESS_DENIED: "accessDenied",
			ECHO_CANCELLATION_MODE_CHANGED: "echoCancellationModeChanged",

			// DeviceManager Events
			DEVICES_DETECTED: "devicesDetected",

			// DevicePanel Events
			DEVICES_SELECTED: "devicesSelected",
			CLOSE_BUTTON_CLICK: "closeButtonClick",

			HAS_REQUIREMENTS: 1,
			OLD_FLASH_VERSION: 0,

			// Stream types
			BASIC_STREAM: "basic",
			MULTIPLEXED_STREAM: "multiplexed",
			ARCHIVED: "archive",

			// Global group ID
			GLOBAL_GROUP: "global",

			// Multiplexer Switch Type
			MULTIPLEXER_TIMEOUT_BASED_SWITCH: 0,
			MULTIPLEXER_ACTIVITY_BASED_SWITCH: 1,

			simulateMobile: false,

			//--------------------------------------
			//  TB STATIC FUNCTIONS
			//--------------------------------------
			
			setLogLevel: function(value) {
				window.opentokdebug.setLevel(value);
				if (value == this.NONE) window.opentokdebug.setCallback(null);
				else window.opentokdebug.setCallback(traceOut, true);
				debug("TB.setLogLevel(" + value + ")" );
			},


			log: function(str) {
				window.opentokdebug.log("[LOG] opentok: " + str);
			},

			initSession: function(sessionId) {
				debug("TB.initSession(" + sessionId + ")");
				if (sessionId == null || sessionId == "") {
					var errorMsg = "TB.initSession :: sessionId cannot be null";
					error(errorMsg);
					throw new Error(errorMsg);
				}

				if (!this.sessions.hasOwnProperty(sessionId)) {
					this.sessions[sessionId] = new Session(sessionId);
				}

				return this.sessions[sessionId];
			},

			initDeviceManager: function(apiKey) {
				debug("TB.initDeviceManager(" + apiKey + ")");
				if (!apiKey) {
					var errorMsg = "TB.initDeviceManager :: apiKey cannot be null";
					error(errorMsg);
					throw new Error(errorMsg);
				}
				if (!deviceManager) {
					deviceManager = new DeviceManager(apiKey);
				}
				return deviceManager;
			},
			
			initRecorderManager: function(apiKey) {
				debug("TB.initRecorderManager(" + apiKey + ")");
				if (!apiKey) {
					var errorMsg = "TB.initRecorderManager :: apiKey cannot be null";
					error(errorMsg);
					throw new Error(errorMsg);
				}
				if (!recorderManager) {
					recorderManager = new RecorderManager(apiKey);
				}
				return recorderManager;
			},

			addEventListener: function(type, callback) {
				debug("TB.addEventListener(" + type + ")");
				dispatcher.addEventListener(type, callback);
			},

			removeEventListener: function(type, callback) {
				debug("TB.removeEventListener(" + type + ")");
				dispatcher.removeEventListener(type, callback);
			},

			dispatchEvent: function(event) {
				debug("TB.dispatchEvent()");
				event.target = this;
				dispatcher.dispatchEvent(event);
			},

			checkSystemRequirements: function() {
				debug("TB.checkSystemRequirements()");
				return swfobject.hasFlashPlayerVersion(MIN_FLASH_VERSION) ? this.HAS_REQUIREMENTS : this.OLD_FLASH_VERSION;
			},

			//--------------------------------------
			//  FLASH CALLBACK HANDLERS
			//--------------------------------------

			// TB callbacks
			exceptionHandler: function(msg, title, errorCode) {
				error("TB.exception :: title: " + title + " msg: " + msg + " errorCode: " + errorCode);
				try {
					this.dispatchEvent(new ExceptionEvent(this.EXCEPTION, msg, title, errorCode));
				} catch(err) {
					var errorMsg = "TB.exception :: Failed to dispatch exception - " + err;
					error(errorMsg);
					// Don't throw an error because this is asynchronous
					// don't do an exceptionHandler because that would be recursive
				}
			},

			// private callback
			controllerLoadedHandler: function() {
				controllerLoaded = true;
			},

			controllerLoadCheck: function(event) {
				if (!controllerLoaded) {
					var confirmMsg = "The connection timed out. Make sure that you have allowed this page in the"
									+ "Flash Player Global Settings Manager. Go to:";
					adobeURL = "http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager04.html";
					prompt(confirmMsg, adobeURL);
				}
			},

			// private callback
			flashLogger: function(msg) {
				flashdebug(msg);
			},

			// private callback
			destroyStreamHandler: function(sessionId, streamObjects) {
				debug("TB.destroyStream");
				try {
					var session = this.sessions[sessionId];
					var streams = getStreams(streamObjects, sessionId);

					var action = function() {
						for (var i = 0; i < streams.length; i++) {
							var publisher = session.getPublisherForStream(streams[i]);
							if (publisher) {
								session.unpublish(publisher);
							}
						}
					};

					// The event handler is called asynchronously after 2 milliseconds.
					setTimeout(action, 2);
				} catch(err) {
					var errorMsg = "TB.destroyStream :: " + err;
					error(errorMsg);
					TB.exceptionHandler(errorMsg, "Internal Error", 2000);
				}
			},

			// Session callbacks
			sessionConnectedHandler: function(sessionId, connectionId, connectionObjects, streamObjects, groupObjects, capabilities, connectionQuality, p_archives) {
				debug("TB.sessionConnected");
				try {
					var session = this.sessions[sessionId];
					for(var i=0, len = connectionObjects.length; i < len; i++) {
					    connection = connectionObjects[i];
					    if(connection.connectionId == connectionId) {
						session.connection = new Connection(connectionId, connection.creationTime, connection.data);
						break;
					    }
					}
					session.connected = true;
					session.connecting = false;
					session.connection.quality = connectionQuality;
					session.capabilities = capabilities;
					var connections = getConnections(connectionObjects);
					var streams = getStreams(streamObjects, session.sessionId);
					var groups = getGroups(sessionId,groupObjects);
					for (var i=0; i < groups.length; i++) {
						this.groups[sessionId + "_" + groups[i].groupId] = groups[i];
					}
					
					var archives = [];
					for (var i=0; i < p_archives.length; i++) {
						var newArchive = getArchive(p_archives[i], sessionId);
						archives.push(newArchive);
					};
					
					session.dispatchEvent(new SessionConnectEvent(this.SESSION_CONNECTED, connections, streams, groups, archives));
				}
				catch(err) {
					var errorMsg = "TB.sessionConnected :: "+err;
					error(errorMsg);
					TB.exceptionHandler(errorMsg, "Internal Error", 2000);
				}
			},

			sessionDisconnectedHandler: function(sessionId, reason) {
				debug("TB.sessionDisconnected(" + reason + ")");
				try {
					var session = this.sessions[sessionId];
					session.disconnectComponents();
					session.cleanupConnection();
					session.connected = false;

					var event = new SessionDisconnectEvent(this.SESSION_DISCONNECTED, reason, true);
					session.dispatchEvent(event);

					var defaultAction = function() {
						if (!event.isDefaultPrevented()) {
							session.cleanup();
						}
					};

					// The event handler is called asynchronously after 1 millisecond. The default action happens after that.
					setTimeout(defaultAction, 2);
				} catch(err) {
					var errorMsg = "TB.sessionDisconnected :: " + err;
					error(errorMsg);
					TB.exceptionHandler(errorMsg, "Internal Error", 2000);
				}
			},

			streamCreatedHandler: function(sessionId, streamObjects, reason) {
				debug("TB.streamCreated");
				try {
					var session = this.sessions[sessionId];

					var streams = getStreams(streamObjects, sessionId);
					session.dispatchEvent(new StreamEvent(this.STREAM_CREATED, streams, reason));

					//notify publisher if there's an archive in flight
					var myArchives = createdArchives[sessionId];
					for (var bob in myArchives) {
						for (var i=0; i<streams.length; i++) {
							if (streams[i].connection.connectionId == connection.connectionId) {
								for (var pub in session.publishers) {
									if (session.publishers[pub].hasOwnProperty("id")) {
										var publisher = document.getElementById(session.publishers[pub].id);
							if (bob && myArchives[bob] &&  myArchives[bob].type == TB.PER_SESSION && myArchives[bob].recording == true) {
								publisher.signalRecordingStarted();
					    }
									}
								}
							}
						}
					}

				} catch(err) {
					var errorMsg = "TB.streamCreated :: "+err;
					error(errorMsg);
					TB.exceptionHandler(errorMsg, "Internal Error", 2000);
				}
			},

			streamDestroyedHandler: function(sessionId, streamObjects, reason) {
				debug("TB.streamDestroyed");
				try {
					var session = this.sessions[sessionId];
					var streams = getStreams(streamObjects, sessionId);
					var event = new StreamEvent(this.STREAM_DESTROYED, streams, reason, true);
					session.dispatchEvent(event);

					var defaultAction = function() {
						if (!event.isDefaultPrevented()) {
							for (var i = 0; i < event.streams.length; i++) {
								var subscribers = session.getSubscribersForStream(event.streams[i]);
								for (var j = 0; j < subscribers.length; j++) {
									session.unsubscribe(subscribers[j]);
								}
								var publisher = session.getPublisherForStream(event.streams[i]);
								if (publisher) {
									session.unpublish(publisher);
								}
							}
						}
					};

					// The event handler is called asynchronously after 1 millisecond. The default action happens after that.
					setTimeout(defaultAction, 2);
				} catch(err) {
					var errorMsg = "TB.streamDestroyed :: " + err;
					error(errorMsg);
					TB.exceptionHandler(errorMsg, "Internal Error", 2000);
				}
			},

		streamPropertyChangedHandler: function(sessionId, streamObj, changedProperty, oldValue, newValue) {
				debug("TB.streamPropertyChangedHandler");

				var session = this.sessions[sessionId];
				var stream = getStream(streamObj, sessionId);

			var event = new StreamPropertyChangedEvent(this.STREAM_PROPERTY_CHANGED, stream, changedProperty, oldValue, newValue);

			session.dispatchEvent(event);

			try {
				var subscriber;
				if ("hasAudio" == changedProperty) {
					for (var componentId in session.subscribers) {
						subscriber = session.subscribers[componentId];
						if (subscriber.hasOwnProperty("stream") && subscriber.stream.streamId == stream.streamId) {
							subscriber._subscribeToAudio(newValue, true);
							break;
						}
					}
				} else if ("hasVideo" == changedProperty) {
					for (componentId in session.subscribers) {
						subscriber = session.subscribers[componentId];
						if (subscriber.hasOwnProperty("stream") && subscriber.stream.streamId == stream.streamId) {
							subscriber._subscribeToVideo(newValue, true);
							break;
						}
					}
				} else if ("orientation" == changedProperty) {
					for (componentId in session.subscribers) {
						subscriber = session.subscribers[componentId];
						if (subscriber.hasOwnProperty("stream") && subscriber.stream.streamId == stream.streamId) {
							subscriber.changeOrientation(newValue);
							break;
						}
					}
				} else if ("quality" == changedProperty) {
				    //do nothing.
				} else {
					debug("Unknown property changed");
				}
			} catch(err) {
				var errorMsg = "TB.streamPropertyChangedHandler :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
        },
        
		microphoneLevelChangedHandler: function(sessionId, componentId, streamId, volume){
		                       //debug("TB.microphoneLevelChangedHandler: " + streamId);                                                                                                                                  
						   try {
		                           var session = this.sessions[sessionId];
		
		                           if (!session) {
		                               var errorMsg = "TB.microphoneLevelChangedHandler :: Invalid session ID: " + sessionId;
		                               error(errorMsg);
		                               TB.exceptionHandler(errorMsg, "Internal Error", 2000);
		                               return;
		                           }
		                               
		                           var subscriber = session.subscribers[componentId];
		                               
		                           var event = new VolumeEvent(this.MICROPHONE_LEVEL_CHANGED, streamId, volume);
								   session.dispatchEvent(event);
		                       } catch (err) {
		                           errorMsg = "microphoneLevelChanged :: " + err;
		                           error(errorMsg);
		                           TB.exceptionHandler(errorMsg, "Internal Error", 2000);
		                       }
		},

		connectionCreatedHandler: function(sessionId, connectionObjects, reason) {
			debug("TB.connectionCreated");
			try {
				var session = this.sessions[sessionId];

				var connections = getConnections(connectionObjects);
				session.dispatchEvent(new ConnectionEvent(this.CONNECTION_CREATED, connections, reason));
			} catch(err) {
				var errorMsg = "TB.connectionCreated :: "+err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		connectionDestroyedHandler: function(sessionId, connectionObjects, reason) {
			debug("TB.connectionDestroyed");
			try {
				var session = this.sessions[sessionId];

				var connections = getConnections(connectionObjects);

				session.dispatchEvent(new ConnectionEvent(this.CONNECTION_DESTROYED, connections, reason));
			} catch(err) {
				var errorMsg = "TB.connectionDestroyed :: "+err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		signalHandler: function(sessionId, fromId) {
			debug("TB.signal");
			try {
				var session = this.sessions[sessionId];

				session.dispatchEvent(new SignalEvent(this.SIGNAL_RECEIVED, getConnectionFromConnectionId(fromId)));
			} catch(err) {
				var errorMsg = "TB.signal ::"+err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		archiveCreatedHandler: function(sessionId, archive) {
			debug("TB.archiveCreatedHandler:" + sessionId + " - " + archive);
			try {
				var session = this.sessions[sessionId];
				var newArchive = getArchive(archive, sessionId);
				session.dispatchEvent(new ArchiveEvent(this.ARCHIVE_CREATED, [newArchive]));
			} catch(err) {
				var errorMsg = "TB.archiveCreatedHandler :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		archiveClosedHandler: function(sessionId, archive) {
			debug("TB.archiveClosedHandler:" + sessionId + " - " + archive.id);
			try {
				var session = this.sessions[sessionId];
				session.dispatchEvent(new ArchiveEvent(this.ARCHIVE_CLOSED, [createdArchives[sessionId][archive.id]]));
				delete createdArchives[sessionId][archive.id];
			} catch(err) {
				var errorMsg = "TB.archiveClosedHandler :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		archiveLoadedHandler: function(sessionId, archive) {
			debug("TB.archiveLoadedHandler:" + sessionId + " - " + archive.archiveId);
			try {
				var session = this.sessions[sessionId];
				var newArchive = new Archive(archive.id, archive.type, archive.title, sessionId);
				if (!loadedArchives.hasOwnProperty(sessionId)) loadedArchives[sessionId] = {};
				loadedArchives[sessionId][archive.id] = newArchive;
				session.dispatchEvent(new ArchiveEvent(this.ARCHIVE_LOADED, [newArchive]));
			} catch(err) {
				var errorMsg = "TB.archiveLoadedHandler :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		sessionRecordingStartedHandler: function(sessionId, archive) {
			debug("TB.sessionRecordingStartedHandler:" + sessionId + " - " + archive.id);
			try {
				var session = this.sessions[sessionId];
				session.dispatchEvent(new ArchiveEvent(this.SESSION_RECORDING_STARTED, [createdArchives[archive.id]]));
			} catch(err) {
				var errorMsg = "TB.sessionRecordingStartedHandler :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		sessionRecordingStoppedHandler: function(sessionId, archive) {
			debug("TB.sessionRecordingStoppedHandler:" + sessionId + " - " + archive);
			try {
				var session = this.sessions[sessionId];
				session.dispatchEvent(new ArchiveEvent(this.SESSION_RECORDING_STOPPED, [createdArchives[archive.id]]));
				
				for (var pub in session.publishers) {
					if (session.publishers[pub].hasOwnProperty("id")) {
						var publisher = document.getElementById(session.publishers[pub].id);
						publisher.signalRecordingStopped();
					}
				};
			} catch(err) {
				var errorMsg = "TB.sessionRecordingStoppedHandler :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		sessionRecordingInProgressHandler: function(sessionId) {
			debug("TB.sessionRecordingInProgressHandler");
			try {
				var session = this.sessions[sessionId];
				session.dispatchEvent(new Event(this.SESSION_RECORDING_IN_PROGRESS, false));
			} catch(err) {
				var errorMsg = "TB.sessionRecordingStartedHandler :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		sessionNotRecordingHandler: function(sessionId) {
			debug("TB.sessionNotRecordingHandler");
			try {
				var session = this.sessions[sessionId];
				session.dispatchEvent(new Event(this.SESSION_NOT_RECORDING, false));
			} catch(err) {
				var errorMsg = "TB.sessionNotRecordingHandler :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		streamRecordingStartedHandler: function(sessionId, streamObjects) {
			debug("TB.streamRecordingStartedHandler:" + sessionId);
			try {
				var session = this.sessions[sessionId];
				var streams = getStreams(streamObjects, sessionId);
				session.dispatchEvent(new StreamEvent(this.STREAM_RECORDING_STARTED, streams, "", false));
				
				for (var pub in session.publishers) {
					if (session.publishers[pub].hasOwnProperty("id")) {
						var publisher = document.getElementById(session.publishers[pub].id);
						for (var i=0; i < streamObjects.length; i++) {
							if (publisher.getStreamId() == streamObjects[i].streamId) {
								publisher.signalRecordingStarted();
								debug("TB.streamRecordingStartedHandler: signal: " + streamObjects[i].streamId);
								break;
							}
						};
					}			
				};
			} catch(err) {
				var errorMsg = "TB.streamRecordingStartedHandler :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		streamRecordingStoppedHandler: function(sessionId, streamObjects) {
			debug("TB.streamRecordingStoppedHandler");
			try {
				var session = this.sessions[sessionId];
				var streams = getStreams(streamObjects, sessionId);
				session.dispatchEvent(new StreamEvent(this.STREAM_RECORDING_STOPPED, streams, "", false));
				
				for (var pub in session.publishers) {
					if (session.publishers[pub].hasOwnProperty("id")) {
						var publisher = document.getElementById(session.publishers[pub].id);
						
						for (var i=0; i < streamObjects.length; i++) {
							if (publisher.getStreamId() == streamObjects[i].streamId) {
								publisher.signalRecordingStopped();
								debug("TB.streamRecordingStoppedHandler: signal: " + streamObjects[i].streamId);
								break;
							}
						}
					}			
				};
			} catch(err) {
				var errorMsg = "TB.streamRecordingStoppedHandler :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		streamRecordingInProgressHandler: function(sessionId, streamObjects) {
			debug("TB.streamRecordingInProgressHandler");
			try {
				var session = this.sessions[sessionId];
				var streams = getStreams(streamObjects, sessionId);
				session.dispatchEvent(new StreamEvent(this.STREAM_RECORDING_IN_PROGRESS, streams, "", false));
			} catch(err) {
				var errorMsg = "TB.streamRecordingInProgressHandler :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		playbackStartedHandler: function(sessionId, archive) {
			debug("TB.playbackStartedHandler");
			try {
				var session = this.sessions[sessionId];
				archiveObj = new Archive(archive.id, archive.type, archive.title, sessionId);
				session.dispatchEvent(new ArchiveEvent(this.PLAYBACK_STARTED, [archiveObj]));
			} catch(err) {
				var errorMsg = "TB.playbackStartedHandler :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		playbackStoppedHandler: function(sessionId, archive) {
			debug("TB.playbackStoppedHandler");
			try {
				var session = this.sessions[sessionId];
				archiveObj = new Archive(archive.id, archive.type, archive.title, sessionId);
				session.dispatchEvent(new ArchiveEvent(this.PLAYBACK_STOPPED, [archiveObj]));
			} catch(err) {
				var errorMsg = "TB.playbackStoppedHandler :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		// Group callbacks
		groupPropertiesUpdatedHandler: function(sessionId, groupObject) {
			debug("TB.groupPropertiesUpdated");
			try {
				var group = this.groups[sessionId + "_" + groupObject.groupId];
                if(!group) {
                    error("TB.groupPropertiesUpdated :: Invalid group ID: " + sessionId + "_" + groupObject.groupId);
                    return;
                }

    			group.dispatchEvent(new Event(this.GROUP_PROPERTIES_UPDATED));
			} catch(err) {
				var errorMsg ="TB.groupPropertiesUpdated :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		// Publisher or Subscriber callbacks
		
		//publisher callbacks:
		
		videoComponentLoadedHandler: function(sessionId, componentId) {
			try {
				if (sessionId) {
					var session = this.sessions[sessionId];
	    			if(!session) return;

					var publisher = session.publishers[componentId];
					var subscriber = session.subscribers[componentId];

					if (publisher && !publisher.loaded) {
						publisher.loaded = true;
						if (publisher.modified) {
							if (publisher.audioPublished != null) publisher.publishAudio(publisher.audioPublished);
							if (publisher.videoPublished != null) publisher.publishVideo(publisher.videoPublished);
							publisher.setMicrophoneGain(publisher.gain);
							publisher.setStyle(publisher._style);
							publisher.modified = false;
						}
						publisher.dispatchEvent(new Event("loaded"));
					}

					if (subscriber && !subscriber.loaded) {
						subscriber.loaded = true;
						if (subscriber.modified) {
							if (subscriber.audioSubscribed != null) subscriber.subscribeToAudio(subscriber.audioSubscribed);
							if (subscriber.videoSubscribed != null) subscriber.subscribeToVideo(subscriber.videoSubscribed);
							subscriber.setAudioVolume(subscriber.audioVolume);
							subscriber.setStyle(subscriber._style);
							subscriber.modified = false;
						}
						subscriber.dispatchEvent(new Event("loaded"));
					}
				} else {
					var player = recorderManager.players[componentId];
					if (player && player._archiveId) { 
						player.loadArchive(player._archiveId);
						player._archiveId = null;
					}
					
					if (player && player._play) { 
						player.play();
						player._play = false;
					}

					var recorder = recorderManager.recorders[componentId];
					var component = player ? player : recorder;
					if (component && !component.loaded) {
						component.loaded = true;
						if (component.modified) {
							component.setStyle(component._style);
							if (component == recorder && component._title) {
								component.setTitle(_title);
								_title = "";
							}
							component.modified = false;
						}
						component.dispatchEvent(new Event("loaded"));
					}
					
				}
			} catch (err) {
				var errorMsg = "videoComponentLoaded:: initialize component " + componentId + " - " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		// Used in resizing the publisher
		pubWidgetStyleHeightFrom: null,
		pubWidgetStyleWidthFrom: null,

		// Publisher callbacks
		resizePublisherToTarget: function(sessionId, publisherId) {
			debug("TB.resize");
			try {
				var session = this.sessions[sessionId];
				if (!session) {
					var errorMsg = "TB.resize :: Invalid session ID: " + sessionId;
					error(errorMsg);
					TB.exceptionHandler(errorMsg, "Internal Error", 2000);
					return;
				}

				var publisher = session.publishers[publisherId];
				if (!publisher) {
					errorMsg = "TB.resize :: Invalid publisher ID: " + publisherId;
					error(errorMsg);
					TB.exceptionHandler(errorMsg, "Internal Error", 2000);
					return;
				}

				var pubWidget = document.getElementById(publisherId);
				if (!pubWidget) {
					errorMsg = "TB.resize :: Publisher " + publisherId + " does not exist in the DOM";
					error(errorMsg);
					TB.exceptionHandler(errorMsg, "Internal Error", 2000);
					return;
				}

				var widthFrom = pubWidget.width;
				var heightFrom = pubWidget.height;

				if (pubWidget.width != publisher.properties.width) {
					pubWidget.width = publisher.properties.width;
				}

				if (pubWidget.height != publisher.properties.height) {
					pubWidget.height = publisher.properties.height;
				}
				if (pubWidget.style.height != pubWidgetStyleHeightFrom) {
					pubWidget.style.height = pubWidgetStyleHeightFrom;
				}

				if (pubWidget.style.width != pubWidgetStyleWidthFrom) {
					pubWidget.style.width = pubWidgetStyleWidthFrom;
				}

				var widthTo = pubWidget.width;
				var heightTo = pubWidget.height;

				if (widthFrom != widthTo || heightFrom != heightTo) {
					// Only dispatch the resize event if we did resize
					publisher.dispatchEvent(new ResizeEvent(this.RESIZE, widthFrom, widthTo, heightFrom, heightTo));
				}
			} catch(err) {
				errorMsg = "resizePublisherToTarget :: Error resizing publisher - " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},


		resizePublisherToShowSecurity: function(sessionId, publisherId, scaleFactor){
			debug("TB.resize");
			var session = this.sessions[sessionId];
			if (!session) {
				var errorMsg = "TB.resize :: Invalid session ID: " + sessionId;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
				return;
			}

			var publisher = session.publishers[publisherId];
			if (!publisher) {
				errorMsg = "TB.resize :: Invalid publisher ID: " + publisherId;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
				return;
			}

			var pubWidget = document.getElementById(publisherId);
			if (!pubWidget) {
				errorMsg = "TB.resize :: Publisher " + publisherId + " does not exist in the DOM";
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
				return;
			}

			var widthFrom = publisher.properties.width = pubWidget.width;
			var heightFrom = publisher.properties.height = pubWidget.height;

			pubWidgetStyleHeightFrom = pubWidget.style.height;
			pubWidgetStyleWidthFrom = pubWidget.style.width;

			// The scaleFactor takes browser zoom into account
			var minWidth = MIN_ADOBE_WIDTH * scaleFactor;
			var minHeight = MIN_ADOBE_HEIGHT * scaleFactor;

			if (pubWidget.width < minWidth) {
				pubWidget.width = minWidth;
				pubWidget.style.width = minWidth + "px";
			}
			if (pubWidget.height < minHeight) {
				pubWidget.height = minHeight;
				pubWidget.style.height = minHeight + "px";
			}

			var widthTo = pubWidget.width;
			var heightTo = pubWidget.height;
			var styleTo = pubWidget.style;

			if (widthFrom != widthTo || heightFrom != heightTo || pubWidgetStyleWidthFrom != styleTo.width || pubWidgetStyleHeightFrom != styleTo.height) {
				// Only dispatch the resize event if we did resize
				publisher.dispatchEvent(new ResizeEvent(this.RESIZE, widthFrom, widthTo, heightFrom, heightTo));
			}

		},

		settingsButtonClickHandler: function(sessionId, publisherId) {
			debug("TB.settingsButtonClick");
			try {
				var session = this.sessions[sessionId];
				if(!session) {
					var errorMsg = "TB.settingsButtonClick :: Invalid session ID: "+sessionId;
					error(errorMsg);
					TB.exceptionHandler(errorMsg, "Internal Error", 2000);
					return;
				}

				var publisher = session.publishers[publisherId];
				if(!publisher) {
					errorMsg = "TB.settingsButtonClick :: Invalid publisher ID: "+publisherId;
                    error(errorMsg);
					TB.exceptionHandler(errorMsg, "Internal Error", 2000);
                    return;
                }

				var event = new Event(this.SETTINGS_BUTTON_CLICK, true);
				publisher.dispatchEvent(event);

				var defaultAction = function() {
					if (!event.isDefaultPrevented()) {
						var dm = TB.initDeviceManager(session.apiKey);
						dm.displayPanel(null, publisher, {});
					}
				};

				// The event handler is called asynchronously after 1 millisecond. The default action happens after that.
				setTimeout(defaultAction, 2);
			} catch(err){
				errorMsg = "settingsButtonClick :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},
		
		
		
		recorderSettingsButtonClickHandler: function(recorderId) {
			debug("TB.recorderSettingsButtonClick");
			try {
				var recorder = recorderManager.recorders[recorderId];
				if(!recorder) {
					errorMsg = "TB.recorderSettingsButtonClick :: Invalid recorder ID: "+recorderId;
                    error(errorMsg);
					TB.exceptionHandler(errorMsg, "Internal Error", 2000);
                    return;
                }

				var event = new Event(this.SETTINGS_BUTTON_CLICK, true);
				recorder.dispatchEvent(event);

				var defaultAction = function() {
					if (!event.isDefaultPrevented()) {
						var dm = TB.initDeviceManager(recorderManager.apiKey);
						dm.displayPanel(null, recorder, {});
					}
				};

				// The event handler is called asynchronously after 1 millisecond. The default action happens after that.
				setTimeout(defaultAction, 2);
			} catch(err){
				errorMsg = "recorderSettingsButtonClick :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		deviceAccessHandler: function(sessionId, publisherId, type) {
			debug("TB.deviceAccessHandler: " + type);
			try {
				var session = this.sessions[sessionId];
				if (!session) {
					var errorMsg = "TB.deviceAccessHandler :: Invalid session ID: " + sessionId;
					error(errorMsg);
					TB.exceptionHandler(errorMsg, "Internal Error", 2000);
					return;
				}

				var publisher = session.publishers[publisherId];
				if (!publisher) {
					errorMsg = "TB.deviceAccessHandler :: Invalid publisher ID: " + publisherId;
					error(errorMsg);
					TB.exceptionHandler(errorMsg, "Internal Error", 2000);
					return;
				}

				var event = new Event(type, true);
				publisher.dispatchEvent(event);

				if (type == TB.ACCESS_DENIED) {
					var defaultAction = function() {
						var publisherElement = document.getElementById(publisher.id);
						if (publisherElement) {
							var parentNode = publisherElement.parentNode;						
							session.unpublish(publisher);
						
							var replaceElement = document.createElement("div");
							replaceElement.setAttribute("id", publisher.replacedDivId);
							parentNode.appendChild(replaceElement);
						
							session._embedPublisher(publisher);
						}
					};

					// The event handler is called asynchronously after 1 millisecond. The default action happens after that.
					setTimeout(defaultAction, 2);
				}
			} catch(err) {
				errorMsg = type + " :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		deviceInactiveHandler: function(sessionId, publisherId, camera, microphone){
			debug("TB.deviceInactiveHandler");

			try {
				var session = this.sessions[sessionId];

				if (!session) {
					var errorMsg = "TB.deviceInactiveHandler :: Invalid session ID: " + sessionId;
					error(errorMsg);
					TB.exceptionHandler(errorMsg, "Internal Error", 2000);
					return;
				}

				var publisher = session.publishers[publisherId];

				if (!publisher) {
					error("TB.deviceInactiveHandler :: Invalid publisher ID: " + publisherId);
					return;
				}

				var event = new DeviceEvent(this.DEVICE_INACTIVE, camera, microphone);
				publisher.dispatchEvent(event);
			} catch (err) {
				errorMsg = "deviceInactive :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},
		
		echoCancellationModeChangedHandler: function(sessionId, publisherId, camera, microphone){
			debug("TB.echoCancellationModeChangedHandler");

			try {
				var session = this.sessions[sessionId];

				if (!session) {
					var errorMsg = "TB.echoCancellationModeChangedHandler :: Invalid session ID: " + sessionId;
					error(errorMsg);
					TB.exceptionHandler(errorMsg, "Internal Error", 2000);
					return;
				}

				var publisher = session.publishers[publisherId];

				if (!publisher) {
					error("TB.echoCancellationModeChangedHandler :: Invalid publisher ID: " + publisherId);
					return;
				}

				var event = new DeviceEvent(this.ECHO_CANCELLATION_MODE_CHANGED, camera, microphone);
				publisher.dispatchEvent(event);
			} catch (err) {
				errorMsg = "echoCancellationModeChanged :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		// DeviceManager callbacks
		devicesDetectedHandler: function(cameraObjects, microphoneObjects, selectedCameraIndex, selectedMicrophoneIndex) {
			debug("TB.devicesDetected");
			try {
				var cameras = getCameras(cameraObjects);
				var microphones = getMicrophones(microphoneObjects);

				deviceManager.dispatchEvent(new DeviceStatusEvent(this.DEVICES_DETECTED, cameras, microphones, cameras[selectedCameraIndex], microphones[selectedMicrophoneIndex]));
				setTimeout(function() { removeSWF(deviceDetectorId, "devicesDetectedHandler :: "); deviceDetectorId = null; }, 0); // must be asynchronous
			} catch(err) {
				var errorMsg = "devicesDetectedHandler :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		// DevicePanel callbacks
		devicesSelectedHandler: function(devicePanelId, camera, microphone) {
			debug("TB.devicesSelected");
			try {
				cameraSelected = true;
				var devicePanel = deviceManager.panels[devicePanelId];
				if(!devicePanel) {
				    error("TB.devicesSelected :: Invalid DevicePanel ID: "+devicePanelId);
				    return;
				}

				if (devicePanel.component) {
					devicePanel.component.setCamera(camera);
					devicePanel.component.setMicrophone(microphone);
				}

				devicePanel.dispatchEvent(new DeviceEvent(this.DEVICES_SELECTED, camera, microphone));
			} catch(err){
				var errorMsg = "devicesSelected :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		closeButtonClickHandler: function(devicePanelId) {
			debug("TB.closeButtonClick");
			try {
				var devicePanel = deviceManager.panels[devicePanelId];
				if(!devicePanel) {
					var errorMsg = "TB.devicesSelected :: Invalid DevicePanel ID: "+devicePanelId;
					error(errorMsg);
					TB.exceptionHandler(errorMsg, "Internal Error", 2000);
				    return;
				}

				var event = new Event(this.CLOSE_BUTTON_CLICK, true);
				devicePanel.dispatchEvent(event);

				var defaultAction = function() {
					if (!event.isDefaultPrevented()) {
						deviceManager.removePanel(devicePanel);
					}
				};

				// The event handler is called asynchronously after 1 millisecond. The default action happens after that.
				setTimeout(defaultAction, 2);
			} catch(err) {
				errorMsg = "closeButtonClick :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		// Player callbacks
		playerArchiveLoadedHandler: function(playerId) {
			debug("Player.archiveLoadedHandler");
			try {
				var player = recorderManager.players[playerId];
				player.dispatchEvent(new Event(this.ARCHIVE_LOADED));
			} catch(err) {
				var errorMsg = "Player.archiveLoadedHandler :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		playingStartedHandler: function(playerId) {
			debug("Player.playingHandler");
			try {
				var player = recorderManager.players[playerId];
				player.dispatchEvent(new Event(this.PLAYBACK_STARTED));
			} catch(err) {
				var errorMsg = "Player.playingStartedHandler :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		playingStoppedHandler: function(playerId, archive) {
			debug("Player.playingStoppedHandler");
			try {
				var player = recorderManager.players[playerId];
				player.dispatchEvent(new Event(this.PLAYBACK_STOPPED));
			} catch(err) {
				var errorMsg = "Player.playingStoppedHandler :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		// Recorder callbacks
		recordingStartedHandler: function(recorderId) {
			debug("Recorder.recordingStartedHandler");
			try {
				var recorder = recorderManager.recorders[recorderId];
				recorder.dispatchEvent(new Event(this.RECORDING_STARTED));
			} catch(err) {
				var errorMsg = "Recorder.recordingStartedHandler :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		recordingStoppedHandler: function(recorderId) {
			debug("Recorder.recordingStoppedHandler");
			try {
				var recorder = recorderManager.recorders[recorderId];
				recorder.dispatchEvent(new Event(this.RECORDING_STOPPED));
			} catch(err) {
				var errorMsg = "Recorder.recordingStoppedHandler :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		recorderPlaybackStartedHandler: function(recorderId) {
			debug("Recorder.playbackStartedddHandler");
			try {
				var recorder = recorderManager.recorders[recorderId];
				recorder.dispatchEvent(new Event(this.PLAYBACK_STARTED));
			} catch(err) {
				var errorMsg = "Recorder.playbackStartedHandler :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		recorderPlaybackStoppedHandler: function(recorderId) {
			debug("Recorder.playbackStoppedHandler");
			try {
				var recorder = recorderManager.recorders[recorderId];
				recorder.dispatchEvent(new Event(this.PLAYBACK_STOPPED));
			} catch(err) {
				var errorMsg = "Recorder.playbackStoppedHandler :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},

		archiveSavedHandler: function(recorderId, archive) {
			debug("Recorder.archiveSavedHandler");
			try {
				var recorder = recorderManager.recorders[recorderId];
				var newArchive = new Archive(archive.id, archive.type, archive.title);
				recorder.dispatchEvent(new ArchiveEvent(this.ARCHIVE_SAVED, [newArchive]));
			} catch(err) {
				var errorMsg = "Recorder.archiveSavedHandler :: " + err;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
			}
		},
		
		stateChangedHandler: function(sessionId, values) {
		    debug("TB.stateChangeHandler");
		    var session = this.sessions[sessionId];
			if(!session) {
				var errorMsg = "TB.stateChangedHandler :: Invalid session ID: "+sessionId;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
				return;
			}

			function getStateMgrForKey(key) {
				key = key.replace(/"/g, "");
				var match = key.match(/TB_archive_([^_]+)_(.*)/);
				if (match) {
					archiveId = match[1];
					key = match[2];
					var archive = loadedArchives[sessionId][archiveId];
					if (!archive) {
						var errorMsg = "Archive.startPlayback :: Archive not loaded.";
						error(errorMsg);
						TB.exceptionHandler(errorMsg, "Internal Error", 2000);
						return;
					}

					return archive.getStateManager();
				}

				return session.getStateManager();
			}

			var changedEventDispatched = false;
			for (var key in values) {
				var stateMgr = getStateMgrForKey(key);

				if (!changedEventDispatched) {
					stateMgr.dispatchEvent(new StateChangedEvent("changed", values));
					changedEventDispatched = true;
				}

				var changedValues = {};
				changedValues[key] = values[key];

				stateMgr.dispatchEvent(new StateChangedEvent("changed:" + key, changedValues));
			}
			
			if (!changedEventDispatched) {
			    session.getStateManager().dispatchEvent(new StateChangedEvent("changed", values));
			}
		},

		stateChangedFailedHandler: function(sessionId, reasonCode, reason, failedValues){
            debug("TB.stateChangedFailedHandler");
		    var session = this.sessions[sessionId];
			if(!session) {
				var errorMsg = "TB.stateChangedFailedHandler :: Invalid session ID: "+sessionId;
				error(errorMsg);
				TB.exceptionHandler(errorMsg, "Internal Error", 2000);
				return;
			}
			
			var stateMgr = session.getStateManager();
			stateMgr.dispatchEvent(new ChangeFailedEvent("changeFailed", reasonCode, reason, failedValues));
		},

		reportIssueHandler: function(issueId, showReport){
			debug("TB.reportIssue");

			if (showReport == null) showReport = false;
			if (showingIssueForm) return;

			// Setup form
			var form = document.createElement("form");
			form.setAttribute("action", "http://staging.tokbox.com/reportIssue.php");
			form.setAttribute("method", "post");
			form.setAttribute("target", "formresult");

			createHiddenElement(form, "issueId", issueId);

			// Add client info
			createHiddenElement(form, "userAgent", navigator.userAgent);
			createHiddenElement(form, "environment", "JS");
			var playerVersion = swfobject.getFlashPlayerVersion();
			createHiddenElement(form, "flashVersion", playerVersion.major + "." + playerVersion.minor + "." + playerVersion.release);

			// Add JS Logs
			var jsLogs = window.opentokdebug.getLogs();
			createHiddenElement(form, "jsLogs", jsLogs);

			var addedAPIKey = false;

			var sessionCount = 0;
			for (var i in TB.sessions) {
				var session = TB.sessions[i];
				if (!session.hasOwnProperty("sessionId")) {
					continue;
				}
				if (!addedAPIKey) {
					createHiddenElement(form, "apiKey", session.apiKey);
					addedAPIKey = true;
				}
				var widgetCount = 0;

				createHiddenElement(form, "session_" + ++sessionCount, session.sessionId);
				// Add controller logs
				var controllerId = "controller_" + session.sessionId;
				var controllerLogs = getDataForUIComponent(controllerId);

				// This may be undefined if a session was initialized but never connected
				if(controllerLogs)
                    createHiddenElement(form, "widget_" + session.sessionId + "_" + ++widgetCount, controllerLogs);

				// Add subscriber logs
				if (session.hasOwnProperty("subscribers")) {
					for (var subscriber in session.subscribers) {
						if (session.subscribers[subscriber].hasOwnProperty("id")) {
							var subscriberLogs = getDataForUIComponent(session.subscribers[subscriber].id);
							createHiddenElement(form, "widget_" + session.sessionId + "_" + ++widgetCount, subscriberLogs);
						}
					}
				}

				// Add publisher logs
				if (session.hasOwnProperty("publishers")) {
					var publisherCount = 0;
					for (var publisher in session.publishers) {
						if (session.publishers[publisher].hasOwnProperty("id")) {
							var publisherLogs = getDataForUIComponent(session.publishers[publisher].id);
							createHiddenElement(form, "widget_" + session.sessionId + "_" + ++widgetCount, publisherLogs);
						}
					}
				}
			}

			if (!showReport) {
				var textField = document.createElement("textarea");
				textField.setAttribute("name", "description");
				textField.setAttribute("rows", 8);
				textField.setAttribute("cols", 40);
				textField.style.height = "110px";
				textField.style.width = "300px";
				textField.style.display = "block";
				textField.style.visibility = "visible";
				form.appendChild(textField);

				var submitBtn = document.createElement("input");
				submitBtn.setAttribute("type", "submit");
				submitBtn.setAttribute("value", "Report Issue");
				submitBtn.style.display = "inline";
				submitBtn.style.visibility = "visible";
				form.appendChild(submitBtn);

				var cancelBtn = document.createElement("input");
				cancelBtn.setAttribute("type", "button");
				cancelBtn.setAttribute("value", "Cancel");
				cancelBtn.style.display = "inline";
				cancelBtn.style.visibility = "visible";
				form.appendChild(cancelBtn);

				var width = 390;
				var height = 242;
				var div = document.createElement("div");
				div.setAttribute('id', 'opentokReportIssue');
				div.style.position = "absolute";
				div.style.top = "25%";
				div.style.left = "50%";
				div.style.width = width + "px";
				div.style.height = height + "px";
				div.style.marginLeft = (0 - width/2) + "px";
				div.style.marginTop = (0 - height/4) + "px";
				div.style.paddingLeft = "32px";
				div.style.paddingRight = "15px";
				div.style.paddingTop = "15px";
				div.style.display = "block";
				div.style.visibility = "visible";
				div.style.lineHeight = "15px";
				div.style.zIndex = highZ() + 1;

				div.innerHTML = "<span style=\"color:#4c4c4c;font-size:18px;display:inline;visibility:visible;\">We're sorry to hear that something went wrong.</span><br/><br/>Please help us to debug your issue by providing a description of what happened.";
				div.style.backgroundColor = "#F7F7F7";
				div.style.border = "1px solid #CCC";
				div.style.fontWeight = "normal";
				div.style.fontFamily = "'Lucida Grande', 'Trebuchet MS', sans-serif";
				div.style.color = "#4c4c4c";
				div.style.fontSize = "13px";

				div.appendChild(form);
				document.body.appendChild(div);
				
                showingIssueForm = true;

				closeForm = function() {
					document.body.removeChild(div);
					showingIssueForm = false;
				};

				cancelBtn.onclick = closeForm;
			}

			form.onsubmit = function() {
				window.open('#', 'formresult', 'scrollbars=no,menubar=no,height=200,width=400,resizable=yes,toolbar=no,status=no');
				setTimeout(function() {closeForm();}, 1000);
			};
			
			if (showReport) {
				createHiddenElement(form, "showReport", true);
				document.body.appendChild(form);
				
				form.submit();
			}
		}

	};
}();
/*!
 *	SWFObject v2.2 <http://code.google.com/p/swfobject/> 
 * 	is released under the MIT License <http://www.opensource.org/licenses/mit-license.php> 
 * 	
 * 	Permission is hereby granted, free of charge, to any person obtaining a copy
 * 	of this software and associated documentation files (the "Software"), to deal
 * 	in the Software without restriction, including without limitation the rights
 * 	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * 	copies of the Software, and to permit persons to whom the Software is
 * 	furnished to do so, subject to the following conditions:
 * 	
 * 	The above copyright notice and this permission notice shall be included in
 * 	all copies or substantial portions of the Software
 */
var swfobject=function(){var D="undefined",r="object",S="Shockwave Flash",W="ShockwaveFlash.ShockwaveFlash",q="application/x-shockwave-flash",R="SWFObjectExprInst",x="onreadystatechange",O=window,j=document,t=navigator,T=false,U=[h],o=[],N=[],I=[],l,Q,E,B,J=false,a=false,n,G,m=true,M=function(){var aa=typeof j.getElementById!=D&&typeof j.getElementsByTagName!=D&&typeof j.createElement!=D,ah=t.userAgent.toLowerCase(),Y=t.platform.toLowerCase(),ae=Y?/win/.test(Y):/win/.test(ah),ac=Y?/mac/.test(Y):/mac/.test(ah),af=/webkit/.test(ah)?parseFloat(ah.replace(/^.*webkit\/(\d+(\.\d+)?).*$/,"$1")):false,X=!+"\v1",ag=[0,0,0],ab=null;if(typeof t.plugins!=D&&typeof t.plugins[S]==r){ab=t.plugins[S].description;if(ab&&!(typeof t.mimeTypes!=D&&t.mimeTypes[q]&&!t.mimeTypes[q].enabledPlugin)){T=true;X=false;ab=ab.replace(/^.*\s+(\S+\s+\S+$)/,"$1");ag[0]=parseInt(ab.replace(/^(.*)\..*$/,"$1"),10);ag[1]=parseInt(ab.replace(/^.*\.(.*)\s.*$/,"$1"),10);ag[2]=/[a-zA-Z]/.test(ab)?parseInt(ab.replace(/^.*[a-zA-Z]+(.*)$/,"$1"),10):0}}else{if(typeof O.ActiveXObject!=D){try{var ad=new ActiveXObject(W);if(ad){ab=ad.GetVariable("$version");if(ab){X=true;ab=ab.split(" ")[1].split(",");ag=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}}catch(Z){}}}return{w3:aa,pv:ag,wk:af,ie:X,win:ae,mac:ac}}(),k=function(){if(!M.w3){return}if((typeof j.readyState!=D&&j.readyState=="complete")||(typeof j.readyState==D&&(j.getElementsByTagName("body")[0]||j.body))){f()}if(!J){if(typeof j.addEventListener!=D){j.addEventListener("DOMContentLoaded",f,false)}if(M.ie&&M.win){j.attachEvent(x,function(){if(j.readyState=="complete"){j.detachEvent(x,arguments.callee);f()}});if(O==top){(function(){if(J){return}try{j.documentElement.doScroll("left")}catch(X){setTimeout(arguments.callee,0);return}f()})()}}if(M.wk){(function(){if(J){return}if(!/loaded|complete/.test(j.readyState)){setTimeout(arguments.callee,0);return}f()})()}s(f)}}();function f(){if(J){return}try{var Z=j.getElementsByTagName("body")[0].appendChild(C("span"));Z.parentNode.removeChild(Z)}catch(aa){return}J=true;var X=U.length;for(var Y=0;Y<X;Y++){U[Y]()}}function K(X){if(J){X()}else{U[U.length]=X}}function s(Y){if(typeof O.addEventListener!=D){O.addEventListener("load",Y,false)}else{if(typeof j.addEventListener!=D){j.addEventListener("load",Y,false)}else{if(typeof O.attachEvent!=D){i(O,"onload",Y)}else{if(typeof O.onload=="function"){var X=O.onload;O.onload=function(){X();Y()}}else{O.onload=Y}}}}}function h(){if(T){V()}else{H()}}function V(){var X=j.getElementsByTagName("body")[0];var aa=C(r);aa.setAttribute("type",q);var Z=X.appendChild(aa);if(Z){var Y=0;(function(){if(typeof Z.GetVariable!=D){var ab=Z.GetVariable("$version");if(ab){ab=ab.split(" ")[1].split(",");M.pv=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}else{if(Y<10){Y++;setTimeout(arguments.callee,10);return}}X.removeChild(aa);Z=null;H()})()}else{H()}}function H(){var ag=o.length;if(ag>0){for(var af=0;af<ag;af++){var Y=o[af].id;var ab=o[af].callbackFn;var aa={success:false,id:Y};if(M.pv[0]>0){var ae=c(Y);if(ae){if(F(o[af].swfVersion)&&!(M.wk&&M.wk<312)){w(Y,true);if(ab){aa.success=true;aa.ref=z(Y);ab(aa)}}else{if(o[af].expressInstall&&A()){var ai={};ai.data=o[af].expressInstall;ai.width=ae.getAttribute("width")||"0";ai.height=ae.getAttribute("height")||"0";if(ae.getAttribute("class")){ai.styleclass=ae.getAttribute("class")}if(ae.getAttribute("align")){ai.align=ae.getAttribute("align")}var ah={};var X=ae.getElementsByTagName("param");var ac=X.length;for(var ad=0;ad<ac;ad++){if(X[ad].getAttribute("name").toLowerCase()!="movie"){ah[X[ad].getAttribute("name")]=X[ad].getAttribute("value")}}P(ai,ah,Y,ab)}else{p(ae);if(ab){ab(aa)}}}}}else{w(Y,true);if(ab){var Z=z(Y);if(Z&&typeof Z.SetVariable!=D){aa.success=true;aa.ref=Z}ab(aa)}}}}}function z(aa){var X=null;var Y=c(aa);if(Y&&Y.nodeName=="OBJECT"){if(typeof Y.SetVariable!=D){X=Y}else{var Z=Y.getElementsByTagName(r)[0];if(Z){X=Z}}}return X}function A(){return !a&&F("6.0.65")&&(M.win||M.mac)&&!(M.wk&&M.wk<312)}function P(aa,ab,X,Z){a=true;E=Z||null;B={success:false,id:X};var ae=c(X);if(ae){if(ae.nodeName=="OBJECT"){l=g(ae);Q=null}else{l=ae;Q=X}aa.id=R;if(typeof aa.width==D||(!/%$/.test(aa.width)&&parseInt(aa.width,10)<310)){aa.width="310"}if(typeof aa.height==D||(!/%$/.test(aa.height)&&parseInt(aa.height,10)<137)){aa.height="137"}j.title=j.title.slice(0,47)+" - Flash Player Installation";var ad=M.ie&&M.win?"ActiveX":"PlugIn",ac="MMredirectURL="+O.location.toString().replace(/&/g,"%26")+"&MMplayerType="+ad+"&MMdoctitle="+j.title;if(typeof ab.flashvars!=D){ab.flashvars+="&"+ac}else{ab.flashvars=ac}if(M.ie&&M.win&&ae.readyState!=4){var Y=C("div");X+="SWFObjectNew";Y.setAttribute("id",X);ae.parentNode.insertBefore(Y,ae);ae.style.display="none";(function(){if(ae.readyState==4){ae.parentNode.removeChild(ae)}else{setTimeout(arguments.callee,10)}})()}u(aa,ab,X)}}function p(Y){if(M.ie&&M.win&&Y.readyState!=4){var X=C("div");Y.parentNode.insertBefore(X,Y);X.parentNode.replaceChild(g(Y),X);Y.style.display="none";(function(){if(Y.readyState==4){Y.parentNode.removeChild(Y)}else{setTimeout(arguments.callee,10)}})()}else{Y.parentNode.replaceChild(g(Y),Y)}}function g(ab){var aa=C("div");if(M.win&&M.ie){aa.innerHTML=ab.innerHTML}else{var Y=ab.getElementsByTagName(r)[0];if(Y){var ad=Y.childNodes;if(ad){var X=ad.length;for(var Z=0;Z<X;Z++){if(!(ad[Z].nodeType==1&&ad[Z].nodeName=="PARAM")&&!(ad[Z].nodeType==8)){aa.appendChild(ad[Z].cloneNode(true))}}}}}return aa}function u(ai,ag,Y){var X,aa=c(Y);if(M.wk&&M.wk<312){return X}if(aa){if(typeof ai.id==D){ai.id=Y}if(M.ie&&M.win){var ah="";for(var ae in ai){if(ai[ae]!=Object.prototype[ae]){if(ae.toLowerCase()=="data"){ag.movie=ai[ae]}else{if(ae.toLowerCase()=="styleclass"){ah+=' class="'+ai[ae]+'"'}else{if(ae.toLowerCase()!="classid"){ah+=" "+ae+'="'+ai[ae]+'"'}}}}}var af="";for(var ad in ag){if(ag[ad]!=Object.prototype[ad]){af+='<param name="'+ad+'" value="'+ag[ad]+'" />'}}aa.outerHTML='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"'+ah+">"+af+"</object>";N[N.length]=ai.id;X=c(ai.id)}else{var Z=C(r);Z.setAttribute("type",q);for(var ac in ai){if(ai[ac]!=Object.prototype[ac]){if(ac.toLowerCase()=="styleclass"){Z.setAttribute("class",ai[ac])}else{if(ac.toLowerCase()!="classid"){Z.setAttribute(ac,ai[ac])}}}}for(var ab in ag){if(ag[ab]!=Object.prototype[ab]&&ab.toLowerCase()!="movie"){e(Z,ab,ag[ab])}}aa.parentNode.replaceChild(Z,aa);X=Z}}return X}function e(Z,X,Y){var aa=C("param");aa.setAttribute("name",X);aa.setAttribute("value",Y);Z.appendChild(aa)}function y(Y){var X=c(Y);if(X&&X.nodeName=="OBJECT"){if(M.ie&&M.win){X.style.display="none";(function(){if(X.readyState==4){b(Y)}else{setTimeout(arguments.callee,10)}})()}else{X.parentNode.removeChild(X)}}}function b(Z){var Y=c(Z);if(Y){for(var X in Y){if(typeof Y[X]=="function"){Y[X]=null}}Y.parentNode.removeChild(Y)}}function c(Z){var X=null;try{X=j.getElementById(Z)}catch(Y){}return X}function C(X){return j.createElement(X)}function i(Z,X,Y){Z.attachEvent(X,Y);I[I.length]=[Z,X,Y]}function F(Z){var Y=M.pv,X=Z.split(".");X[0]=parseInt(X[0],10);X[1]=parseInt(X[1],10)||0;X[2]=parseInt(X[2],10)||0;return(Y[0]>X[0]||(Y[0]==X[0]&&Y[1]>X[1])||(Y[0]==X[0]&&Y[1]==X[1]&&Y[2]>=X[2]))?true:false}function v(ac,Y,ad,ab){if(M.ie&&M.mac){return}var aa=j.getElementsByTagName("head")[0];if(!aa){return}var X=(ad&&typeof ad=="string")?ad:"screen";if(ab){n=null;G=null}if(!n||G!=X){var Z=C("style");Z.setAttribute("type","text/css");Z.setAttribute("media",X);n=aa.appendChild(Z);if(M.ie&&M.win&&typeof j.styleSheets!=D&&j.styleSheets.length>0){n=j.styleSheets[j.styleSheets.length-1]}G=X}if(M.ie&&M.win){if(n&&typeof n.addRule==r){n.addRule(ac,Y)}}else{if(n&&typeof j.createTextNode!=D){n.appendChild(j.createTextNode(ac+" {"+Y+"}"))}}}function w(Z,X){if(!m){return}var Y=X?"visible":"hidden";if(J&&c(Z)){c(Z).style.visibility=Y}else{v("#"+Z,"visibility:"+Y)}}function L(Y){var Z=/[\\\"<>\.;]/;var X=Z.exec(Y)!=null;return X&&typeof encodeURIComponent!=D?encodeURIComponent(Y):Y}var d=function(){if(M.ie&&M.win){window.attachEvent("onunload",function(){var ac=I.length;for(var ab=0;ab<ac;ab++){I[ab][0].detachEvent(I[ab][1],I[ab][2])}var Z=N.length;for(var aa=0;aa<Z;aa++){y(N[aa])}for(var Y in M){M[Y]=null}M=null;for(var X in swfobject){swfobject[X]=null}swfobject=null})}}();return{registerObject:function(ab,X,aa,Z){if(M.w3&&ab&&X){var Y={};Y.id=ab;Y.swfVersion=X;Y.expressInstall=aa;Y.callbackFn=Z;o[o.length]=Y;w(ab,false)}else{if(Z){Z({success:false,id:ab})}}},getObjectById:function(X){if(M.w3){return z(X)}},embedSWF:function(ab,ah,ae,ag,Y,aa,Z,ad,af,ac){var X={success:false,id:ah};if(M.w3&&!(M.wk&&M.wk<312)&&ab&&ah&&ae&&ag&&Y){w(ah,false);K(function(){ae+="";ag+="";var aj={};if(af&&typeof af===r){for(var al in af){aj[al]=af[al]}}aj.data=ab;aj.width=ae;aj.height=ag;var am={};if(ad&&typeof ad===r){for(var ak in ad){am[ak]=ad[ak]}}if(Z&&typeof Z===r){for(var ai in Z){if(typeof am.flashvars!=D){am.flashvars+="&"+ai+"="+Z[ai]}else{am.flashvars=ai+"="+Z[ai]}}}if(F(Y)){var an=u(aj,am,ah);if(aj.id==ah){w(ah,true)}X.success=true;X.ref=an}else{if(aa&&A()){aj.data=aa;P(aj,am,ah,ac);return}else{w(ah,true)}}if(ac){ac(X)}})}else{if(ac){ac(X)}}},switchOffAutoHideShow:function(){m=false},ua:M,getFlashPlayerVersion:function(){return{major:M.pv[0],minor:M.pv[1],release:M.pv[2]}},hasFlashPlayerVersion:F,createSWF:function(Z,Y,X){if(M.w3){return u(Z,Y,X)}else{return undefined}},showExpressInstall:function(Z,aa,X,Y){if(M.w3&&A()){P(Z,aa,X,Y)}},removeSWF:function(X){if(M.w3){y(X)}},createCSS:function(aa,Z,Y,X){if(M.w3){v(aa,Z,Y,X)}},addDomLoadEvent:K,addLoadEvent:s,getQueryParamValue:function(aa){var Z=j.location.search||j.location.hash;if(Z){if(/\?/.test(Z)){Z=Z.split("?")[1]}if(aa==null){return L(Z)}var Y=Z.split("&");for(var X=0;X<Y.length;X++){if(Y[X].substring(0,Y[X].indexOf("="))==aa){return L(Y[X].substring((Y[X].indexOf("=")+1)))}}}return""},expressInstallCallback:function(){if(a){var X=c(R);if(X&&l){X.parentNode.replaceChild(l,X);if(Q){w(Q,true);if(M.ie&&M.win){l.style.display="block"}}if(E){E(B)}}a=false}}}}();/*!
 * JavaScript Debug - v0.4 - 6/22/2010
 * http://benalman.com/projects/javascript-debug-console-log/
 *
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 */

// Script: JavaScript Debug: A simple wrapper for console.log
//
// *Version: 0.4, Last Updated: 6/22/2010*
//
// Tested with Internet Explorer 6-8, Firefox 3-3.6, Safari 3-4, Chrome 3-5, Opera 9.6-10.5
//
// Home       - http://benalman.com/projects/javascript-debug-console-log/
// GitHub     - http://github.com/cowboy/javascript-debug/
// Source     - http://github.com/cowboy/javascript-debug/raw/master/ba-debug.js
// (Minified) - http://github.com/cowboy/javascript-debug/raw/master/ba-debug.min.js (1.1kb)
//
// About: License
//
// Copyright (c) 2010 "Cowboy" Ben Alman,
// Dual licensed under the MIT and GPL licenses.
// http://benalman.com/about/license/
//
// About: Support and Testing
//
// Information about what browsers this code has been tested in.
//
// Browsers Tested - Internet Explorer 6-8, Firefox 3-3.6, Safari 3-4, Chrome
// 3-5, Opera 9.6-10.5
//
// About: Examples
//
// These working examples, complete with fully commented code, illustrate a few
// ways in which this plugin can be used.
//
// Examples - http://benalman.com/code/projects/javascript-debug/examples/debug/
//
// About: Revision History
//
// 0.4 - (6/22/2010) Added missing passthrough methods: exception,
//       groupCollapsed, table
// 0.3 - (6/8/2009) Initial release
//
// Topic: Pass-through console methods
//
// assert, clear, count, dir, dirxml, exception, group, groupCollapsed,
// groupEnd, profile, profileEnd, table, time, timeEnd, trace
//
// These console methods are passed through (but only if both the console and
// the method exists), so use them without fear of reprisal. Note that these
// methods will not be passed through if the logging level is set to 0 via
// <debug.setLevel>.

window.opentokdebug = (function(){
	var window = this,

	// Some convenient shortcuts.
	aps = Array.prototype.slice,
		con = window.console,

	// Public object to be returned.
	that = {},

	callback_func, callback_force,

	// OpenTok has a default of no logging.
	log_level = 0,

	// Logging methods, in "priority order". Not all console implementations
	// will utilize these, but they will be used in the callback passed to
	// setCallback.
	log_methods = ['error', 'warn', 'info', 'debug', 'log'],

	// Pass these methods through to the console if they exist, otherwise just
	// fail gracefully. These methods are provided for convenience.
	pass_methods = 'assert clear count dir dirxml exception group groupCollapsed groupEnd profile profileEnd table time timeEnd trace'.split(' '),
		idx = pass_methods.length,

	// Logs are stored here so that they can be recalled as necessary.
	logs = [];

	while (--idx >= 0) {
		(function(method) {

			// Generate pass-through methods. These methods will be called, if they
			// exist, as long as the logging level is non-zero.
			that[method] = function() {
				log_level !== 0 && con && con[method] && con[method].apply(con, arguments);
			};

		})(pass_methods[idx]);
	}

	idx = log_methods.length;
	while (--idx >= 0) {
		(function(idx, level) {

			// Method: debug.log
			//
			// Call the console.log method if available. Adds an entry into the logs
			// array for a callback specified via <debug.setCallback>.
			//
			// Usage:
			//
			//  debug.log( object [, object, ...] );                               - -
			//
			// Arguments:
			//
			//  object - (Object) Any valid JavaScript object.
			// Method: debug.debug
			//
			// Call the console.debug method if available, otherwise call console.log.
			// Adds an entry into the logs array for a callback specified via
			// <debug.setCallback>.
			//
			// Usage:
			//
			//  debug.debug( object [, object, ...] );                             - -
			//
			// Arguments:
			//
			//  object - (Object) Any valid JavaScript object.
			// Method: debug.info
			//
			// Call the console.info method if available, otherwise call console.log.
			// Adds an entry into the logs array for a callback specified via
			// <debug.setCallback>.
			//
			// Usage:
			//
			//  debug.info( object [, object, ...] );                              - -
			//
			// Arguments:
			//
			//  object - (Object) Any valid JavaScript object.
			// Method: debug.warn
			//
			// Call the console.warn method if available, otherwise call console.log.
			// Adds an entry into the logs array for a callback specified via
			// <debug.setCallback>.
			//
			// Usage:
			//
			//  debug.warn( object [, object, ...] );                              - -
			//
			// Arguments:
			//
			//  object - (Object) Any valid JavaScript object.
			// Method: debug.error
			//
			// Call the console.error method if available, otherwise call console.log.
			// Adds an entry into the logs array for a callback specified via
			// <debug.setCallback>.
			//
			// Usage:
			//
			//  debug.error( object [, object, ...] );                             - -
			//
			// Arguments:
			//
			//  object - (Object) Any valid JavaScript object.
			that[level] = function() {
				var args = aps.call(arguments),
					log_arr = [level].concat(args);

				logs.push(log_arr);

				if (!con || !is_level(idx)) {
					return;
				}
				exec_callback(log_arr); // OpenTok executes callback only if the proper level
				// OpenTok - this is a fix for firebug 1.6.0 submitted by someone else. hopefully it'll get incorporated into
				// the next official release and it can be removed.
				(con.firebug || window.Firebug) ? con[level].apply(con, args) : con[level] ? con[level](args) : con.log(args);
			};

		})(idx, log_methods[idx]);
	}

	// Execute the callback function if set.
	function exec_callback(args) {
		if (callback_func && (callback_force || !con || !con.log)) {
			callback_func.apply(window, args);
		}
	};

	// Method: debug.setLevel
	//
	// Set a minimum or maximum logging level for the console. Doesn't affect
	// the <debug.setCallback> callback function, but if set to 0 to disable
	// logging, <Pass-through console methods> will be disabled as well.
	//
	// Usage:
	//
	//  debug.setLevel( [ level ] )                                            - -
	//
	// Arguments:
	//
	//  level - (Number) If 0, disables logging. If negative, shows N lowest
	//    priority levels of log messages. If positive, shows N highest priority
	//    levels of log messages.
	//
	// Priority levels:
	//
	//   log (1) < debug (2) < info (3) < warn (4) < error (5)
	that.setLevel = function(level) {
		log_level = typeof level === 'number' ? level : 9;
	};

	// Determine if the level is visible given the current log_level.
	function is_level(level) {
		return log_level > 0 ? log_level > level : log_methods.length + log_level <= level;
	};

	// Method: debug.setCallback
	//
	// Set a callback to be used if logging isn't possible due to console.log
	// not existing. If unlogged logs exist when callback is set, they will all
	// be logged immediately unless a limit is specified.
	//
	// Usage:
	//
	//  debug.setCallback( callback [, force ] [, limit ] )
	//
	// Arguments:
	//
	//  callback - (Function) The aforementioned callback function. The first
	//    argument is the logging level, and all subsequent arguments are those
	//    passed to the initial debug logging method.
	//  force - (Boolean) If false, log to console.log if available, otherwise
	//    callback. If true, log to both console.log and callback.
	//  limit - (Number) If specified, number of lines to limit initial scrollback
	//    to.
	that.setCallback = function() {
		var args = aps.call(arguments),
			max = logs.length,
			i = max;

		callback_func = args.shift() || null;
		callback_force = typeof args[0] === 'boolean' ? args.shift() : false;

		i -= typeof args[0] === 'number' ? args.shift() : max;

		while (i < max) {
			exec_callback(logs[i++]);
		}
	};

	that.getLogs = function() {
		return logs.join('\n');
	};

	return that;
})();// Add missing IE methods

// This was taken from:
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/keys
if (!Object.keys) Object.keys = function(o) {
	if (o !== Object(o)) throw new TypeError('Object.keys called on non-object');
	var ret = [],
		p;
	for (p in o) {
		if (Object.prototype.hasOwnProperty.call(o, p)) {
			ret.push(p);
		}
	}
	return ret;
};

// This was taken from:
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(searchElement) {
		"use strict";
		if (this === void 0 || this === null) {
			throw new TypeError();
		}
		var t = Object(this);
		var len = t.length >>> 0;
		if (len === 0) {
			return -1;
		}
		var n = 0;
		if (arguments.length > 0) {
			n = Number(arguments[1]);
			if (n !== n) { // shortcut for verifying if it's NaN  
				n = 0;
			} else if (n !== 0 && n !== Infinity && n !== -Infinity) {
				n = (n > 0 || -1) * Math.floor(Math.abs(n));
			}
		}
		if (n >= len) {
			return -1;
		}
		var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
		for (; k < len; k++) {
			if (k in t && t[k] === searchElement) {
				return k;
			}
		}
		return -1;
	};
}