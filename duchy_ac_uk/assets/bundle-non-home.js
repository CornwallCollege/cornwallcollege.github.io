/*___________________________________________________________________________________________________________________________________________________
 _ jquery.mb.components                                                                                                                             _
 _                                                                                                                                                  _
 _ file: jquery.mb.YTPlayer.src.js                                                                                                                  _
 _ last modified: 05/01/16 17.43                                                                                                                    _
 _                                                                                                                                                  _
 _ Open Lab s.r.l., Florence - Italy                                                                                                                _
 _                                                                                                                                                  _
 _ email: matteo@open-lab.com                                                                                                                       _
 _ site: http://pupunzi.com                                                                                                                         _
 _       http://open-lab.com                                                                                                                        _
 _ blog: http://pupunzi.open-lab.com                                                                                                                _
 _ Q&A:  http://jquery.pupunzi.com                                                                                                                  _
 _                                                                                                                                                  _
 _ Licences: MIT, GPL                                                                                                                               _
 _    http://www.opensource.org/licenses/mit-license.php                                                                                            _
 _    http://www.gnu.org/licenses/gpl.html                                                                                                          _
 _                                                                                                                                                  _
 _ Copyright (c) 2001-2016. Matteo Bicocchi (Pupunzi);                                                                                              _
 ___________________________________________________________________________________________________________________________________________________*/

var ytp = ytp || {};

function onYouTubeIframeAPIReady() {
	if( ytp.YTAPIReady ) return;
	ytp.YTAPIReady = true;
	jQuery( document ).trigger( "YTAPIReady" );
}

var getYTPVideoID = function( url ) {
	var videoID, playlistID;
	if( url.indexOf( "youtu.be" ) > 0 ) {
		videoID = url.substr( url.lastIndexOf( "/" ) + 1, url.length );
		playlistID = videoID.indexOf( "?list=" ) > 0 ? videoID.substr( videoID.lastIndexOf( "=" ), videoID.length ) : null;
		videoID = playlistID ? videoID.substr( 0, videoID.lastIndexOf( "?" ) ) : videoID;
	} else if( url.indexOf( "http" ) > -1 ) {
		//videoID = url.match( /([\/&]v\/([^&#]*))|([\\?&]v=([^&#]*))/ )[ 1 ];
		videoID = url.match( /[\\?&]v=([^&#]*)/ )[ 1 ];
		playlistID = url.indexOf( "list=" ) > 0 ? url.match( /[\\?&]list=([^&#]*)/ )[ 1 ] : null;
	} else {
		videoID = url.length > 15 ? null : url;
		playlistID = videoID ? null : url;
	}
	return {
		videoID: videoID,
		playlistID: playlistID
	};
};

( function( jQuery, ytp ) {

	jQuery.mbYTPlayer = {
		name: "jquery.mb.YTPlayer",
		version: "3.0.8",
		build: "5878",
		author: "Matteo Bicocchi",
		apiKey: "",
		defaults: {
			containment: "body",
			ratio: "auto", // "auto", "16/9", "4/3"
			videoURL: null,
			playlistURL: null,
			startAt: 0,
			stopAt: 0,
			autoPlay: true,
			vol: 50, // 1 to 100
			addRaster: false,
			mask: false,
			opacity: 1,
			quality: "default", //or “small”, “medium”, “large”, “hd720”, “hd1080”, “highres”
			mute: false,
			loop: true,
			showControls: true,
			showAnnotations: false,
			showYTLogo: true,
			stopMovieOnBlur: true,
			realfullscreen: true,
			mobileFallbackImage: null,
			gaTrack: true,
			optimizeDisplay: true,
			align: "center,center", // top,bottom,left,right
			onReady: function( player ) {}
		},
		/**
		 *  @fontface icons
		 *  */
		controls: {
			play: "P",
			pause: "p",
			mute: "M",
			unmute: "A",
			onlyYT: "O",
			showSite: "R",
			ytLogo: "Y"
		},
		controlBar: null,
		loading: null,
		locationProtocol: "https:",
		filters: {
			grayscale: {
				value: 0,
				unit: "%"
			},
			hue_rotate: {
				value: 0,
				unit: "deg"
			},
			invert: {
				value: 0,
				unit: "%"
			},
			opacity: {
				value: 0,
				unit: "%"
			},
			saturate: {
				value: 0,
				unit: "%"
			},
			sepia: {
				value: 0,
				unit: "%"
			},
			brightness: {
				value: 0,
				unit: "%"
			},
			contrast: {
				value: 0,
				unit: "%"
			},
			blur: {
				value: 0,
				unit: "px"
			}
		},
		/**
		 *
		 * @param options
		 * @returns [players]
		 */
		buildPlayer: function( options ) {
			return this.each( function() {
				var YTPlayer = this;
				var $YTPlayer = jQuery( YTPlayer );
				YTPlayer.loop = 0;
				YTPlayer.opt = {};
				YTPlayer.state = {};
				YTPlayer.filters = jQuery.mbYTPlayer.filters;
				YTPlayer.filtersEnabled = true;
				YTPlayer.id = YTPlayer.id || "YTP_" + new Date().getTime();
				$YTPlayer.addClass( "mb_YTPlayer" );
				var property = $YTPlayer.data( "property" ) && typeof $YTPlayer.data( "property" ) == "string" ? eval( '(' + $YTPlayer.data( "property" ) + ')' ) : $YTPlayer.data( "property" );
				if( typeof property != "undefined" && typeof property.vol != "undefined" ) property.vol = property.vol === 0 ? property.vol = 1 : property.vol;

				jQuery.extend( YTPlayer.opt, jQuery.mbYTPlayer.defaults, options, property );

				if( !YTPlayer.hasChanged ) {
					YTPlayer.defaultOpt = {};
					jQuery.extend( YTPlayer.defaultOpt, jQuery.mbYTPlayer.defaults, options );
				}

				if( YTPlayer.opt.loop == "true" )
					YTPlayer.opt.loop = 9999;

				YTPlayer.isRetina = ( window.retina || window.devicePixelRatio > 1 );
				var isIframe = function() {
					var isIfr = false;
					try {
						if( self.location.href != top.location.href ) isIfr = true;
					} catch( e ) {
						isIfr = true;
					}
					return isIfr;
				};
				YTPlayer.canGoFullScreen = !( jQuery.browser.msie || jQuery.browser.opera || isIframe() );
				if( !YTPlayer.canGoFullScreen ) YTPlayer.opt.realfullscreen = false;
				if( !$YTPlayer.attr( "id" ) ) $YTPlayer.attr( "id", "video_" + new Date().getTime() );
				var playerID = "mbYTP_" + YTPlayer.id;
				YTPlayer.isAlone = false;
				YTPlayer.hasFocus = true;
				var videoID = this.opt.videoURL ? getYTPVideoID( this.opt.videoURL ).videoID : $YTPlayer.attr( "href" ) ? getYTPVideoID( $YTPlayer.attr( "href" ) ).videoID : false;
				var playlistID = this.opt.videoURL ? getYTPVideoID( this.opt.videoURL ).playlistID : $YTPlayer.attr( "href" ) ? getYTPVideoID( $YTPlayer.attr( "href" ) ).playlistID : false;
				YTPlayer.videoID = videoID;
				YTPlayer.playlistID = playlistID;
				YTPlayer.opt.showAnnotations = YTPlayer.opt.showAnnotations ? '0' : '3';

				var playerVars = {
					'modestbranding': 1,
					'autoplay': 0,
					'controls': 0,
					'showinfo': 0,
					'rel': 0,
					'enablejsapi': 1,
					'version': 3,
					'playerapiid': playerID,
					'origin': '*',
					'allowfullscreen': true,
					'wmode': 'transparent',
					'iv_load_policy': YTPlayer.opt.showAnnotations
				};

				if( document.createElement( 'video' ).canPlayType ) jQuery.extend( playerVars, {
					'html5': 1
				} );
				if( jQuery.browser.msie && jQuery.browser.version < 9 ) this.opt.opacity = 1;

				YTPlayer.isSelf = YTPlayer.opt.containment == "self";
				YTPlayer.defaultOpt.containment = YTPlayer.opt.containment = YTPlayer.opt.containment == "self" ? jQuery( this ) : jQuery( YTPlayer.opt.containment );
				YTPlayer.isBackground = YTPlayer.opt.containment.is( "body" );

				if( YTPlayer.isBackground && ytp.backgroundIsInited )
					return;

				var isPlayer = YTPlayer.opt.containment.is( jQuery( this ) );

				YTPlayer.canPlayOnMobile = isPlayer && jQuery( this ).children().length === 0;
				YTPlayer.isPlayer = false;

				if( !isPlayer ) {
					$YTPlayer.hide();
				} else {
					YTPlayer.isPlayer = true;
				}

				var overlay = jQuery( "<div/>" ).css( {
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%"
				} ).addClass( "YTPOverlay" );

				if( YTPlayer.isPlayer ) {
					overlay.on( "click", function() {
						$YTPlayer.YTPTogglePlay();
					} )
				}

				var wrapper = jQuery( "<div/>" ).addClass( "mbYTP_wrapper" ).attr( "id", "wrapper_" + playerID );
				wrapper.css( {
					position: "absolute",
					zIndex: 0,
					minWidth: "100%",
					minHeight: "100%",
					left: 0,
					top: 0,
					overflow: "hidden",
					opacity: 0
				} );

				var playerBox = jQuery( "<div/>" ).attr( "id", playerID ).addClass( "playerBox" );
				playerBox.css( {
					position: "absolute",
					zIndex: 0,
					width: "100%",
					height: "100%",
					top: 0,
					left: 0,
					overflow: "hidden"
				} );

				wrapper.append( playerBox );

				YTPlayer.opt.containment.children().not( "script, style" ).each( function() {
					if( jQuery( this ).css( "position" ) == "static" ) jQuery( this ).css( "position", "relative" );
				} );
				if( YTPlayer.isBackground ) {
					jQuery( "body" ).css( {
						boxSizing: "border-box"
					} );

					wrapper.css( {
						position: "fixed",
						top: 0,
						left: 0,
						zIndex: 0
					} );

					$YTPlayer.hide();

				} else if( YTPlayer.opt.containment.css( "position" ) == "static" )
					YTPlayer.opt.containment.css( {
						position: "relative"
					} );

				YTPlayer.opt.containment.prepend( wrapper );
				YTPlayer.wrapper = wrapper;

				playerBox.css( {
					opacity: 1
				} );

				if( !jQuery.browser.mobile ) {
					playerBox.after( overlay );
					YTPlayer.overlay = overlay;
				}

				if( !YTPlayer.isBackground ) {
					overlay.on( "mouseenter", function() {
						if( YTPlayer.controlBar.length )
							YTPlayer.controlBar.addClass( "visible" );
					} ).on( "mouseleave", function() {
						if( YTPlayer.controlBar.length )
							YTPlayer.controlBar.removeClass( "visible" );
					} );
				}

				if( !ytp.YTAPIReady ) {
					jQuery( "#YTAPI" ).remove();
					var tag = jQuery( "<script></script>" ).attr( {
						"src": jQuery.mbYTPlayer.locationProtocol + "//www.youtube.com/iframe_api?v=" + jQuery.mbYTPlayer.version,
						"id": "YTAPI"
					} );
					jQuery( "head" ).prepend( tag );
				} else {
					setTimeout( function() {
						jQuery( document ).trigger( "YTAPIReady" );
					}, 100 )
				}

				if( jQuery.browser.mobile && !YTPlayer.canPlayOnMobile ) {

					if( YTPlayer.opt.mobileFallbackImage ) {
						YTPlayer.opt.containment.css( {
							backgroundImage: "url(" + YTPlayer.opt.mobileFallbackImage + ")",
							backgroundPosition: "center center",
							backgroundSize: "cover",
							backgroundRepeat: "no-repeat"
						} )
					};

					$YTPlayer.remove();
					jQuery( document ).trigger( "YTPUnavailable" );
					return;
				}

				jQuery( document ).on( "YTAPIReady", function() {
					if( ( YTPlayer.isBackground && ytp.backgroundIsInited ) || YTPlayer.isInit ) return;
					if( YTPlayer.isBackground ) {
						ytp.backgroundIsInited = true;
					}

					YTPlayer.opt.autoPlay = typeof YTPlayer.opt.autoPlay == "undefined" ? ( YTPlayer.isBackground ? true : false ) : YTPlayer.opt.autoPlay;
					YTPlayer.opt.vol = YTPlayer.opt.vol ? YTPlayer.opt.vol : 100;
					jQuery.mbYTPlayer.getDataFromAPI( YTPlayer );
					jQuery( YTPlayer ).on( "YTPChanged", function() {

						if( YTPlayer.isInit )
							return;

						YTPlayer.isInit = true;

						//if is mobile && isPlayer fallback to the default YT player
						if( jQuery.browser.mobile && YTPlayer.canPlayOnMobile ) {
							// Try to adjust the player dimention
							if( YTPlayer.opt.containment.outerWidth() > jQuery( window ).width() ) {
								YTPlayer.opt.containment.css( {
									maxWidth: "100%"
								} );
								var h = YTPlayer.opt.containment.outerWidth() * .563;
								YTPlayer.opt.containment.css( {
									maxHeight: h
								} );
							}
							new YT.Player( playerID, {
								videoId: YTPlayer.videoID.toString(),
								width: '100%',
								height: h,
								playerVars: playerVars,
								events: {
									'onReady': function( event ) {
										YTPlayer.player = event.target;
										playerBox.css( {
											opacity: 1
										} );
										YTPlayer.wrapper.css( {
											opacity: 1
										} );
									}
								}
							} );
							return;
						}

						new YT.Player( playerID, {
							videoId: YTPlayer.videoID.toString(),
							playerVars: playerVars,
							events: {
								'onReady': function( event ) {
									YTPlayer.player = event.target;
									if( YTPlayer.isReady ) return;
									YTPlayer.isReady = YTPlayer.isPlayer && !YTPlayer.opt.autoPlay ? false : true;
									YTPlayer.playerEl = YTPlayer.player.getIframe();

									jQuery( YTPlayer.playerEl ).unselectable();

									$YTPlayer.optimizeDisplay();
									YTPlayer.videoID = videoID;
									jQuery( window ).off( "resize.YTP_" + YTPlayer.id ).on( "resize.YTP_" + YTPlayer.id, function() {
										$YTPlayer.optimizeDisplay();
									} );

									jQuery.mbYTPlayer.checkForState( YTPlayer );
								},
								/**
								 *
								 * @param event
								 *
								 * -1 (unstarted)
								 * 0 (ended)
								 * 1 (playing)
								 * 2 (paused)
								 * 3 (buffering)
								 * 5 (video cued).
								 *
								 *
								 */
								'onStateChange': function( event ) {
									if( typeof event.target.getPlayerState != "function" ) return;
									var state = event.target.getPlayerState();

									if( YTPlayer.preventTrigger ) {
										YTPlayer.preventTrigger = false;
										return
									}

									/*
																		if( YTPlayer.state == state )
																			return;
									*/

									YTPlayer.state = state;

									var eventType;
									switch( state ) {
										case -1: //----------------------------------------------- unstarted
											eventType = "YTPUnstarted";
											break;
										case 0: //------------------------------------------------ ended
											eventType = "YTPEnd";
											break;
										case 1: //------------------------------------------------ play
											eventType = "YTPPlay";
											if( YTPlayer.controlBar.length )
												YTPlayer.controlBar.find( ".mb_YTPPlaypause" ).html( jQuery.mbYTPlayer.controls.pause );
											if( typeof _gaq != "undefined" && eval( YTPlayer.opt.gaTrack ) ) _gaq.push( [ '_trackEvent', 'YTPlayer', 'Play', ( YTPlayer.hasData ? YTPlayer.videoData.title : YTPlayer.videoID.toString() ) ] );
											if( typeof ga != "undefined" && eval( YTPlayer.opt.gaTrack ) ) ga( 'send', 'event', 'YTPlayer', 'play', ( YTPlayer.hasData ? YTPlayer.videoData.title : YTPlayer.videoID.toString() ) );
											break;
										case 2: //------------------------------------------------ pause
											eventType = "YTPPause";
											if( YTPlayer.controlBar.length )
												YTPlayer.controlBar.find( ".mb_YTPPlaypause" ).html( jQuery.mbYTPlayer.controls.play );
											break;
										case 3: //------------------------------------------------ buffer
											YTPlayer.player.setPlaybackQuality( YTPlayer.opt.quality );
											eventType = "YTPBuffering";
											if( YTPlayer.controlBar.length )
												YTPlayer.controlBar.find( ".mb_YTPPlaypause" ).html( jQuery.mbYTPlayer.controls.play );
											break;
										case 5: //------------------------------------------------ cued
											eventType = "YTPCued";
											break;
										default:
											break;
									}

									// Trigger state events
									var YTPEvent = jQuery.Event( eventType );
									YTPEvent.time = YTPlayer.currentTime;
									if( YTPlayer.canTrigger ) jQuery( YTPlayer ).trigger( YTPEvent );
								},
								/**
								 *
								 * @param e
								 */
								'onPlaybackQualityChange': function( e ) {
									var quality = e.target.getPlaybackQuality();
									var YTPQualityChange = jQuery.Event( "YTPQualityChange" );
									YTPQualityChange.quality = quality;
									jQuery( YTPlayer ).trigger( YTPQualityChange );
								},
								/**
								 *
								 * @param err
								 */
								'onError': function( err ) {

									if( err.data == 150 ) {
										console.log( "Embedding this video is restricted by Youtube." );
										if( YTPlayer.isPlayList ) jQuery( YTPlayer ).playNext();
									}

									if( err.data == 2 && YTPlayer.isPlayList )
										jQuery( YTPlayer ).playNext();

									if( typeof YTPlayer.opt.onError == "function" )
										YTPlayer.opt.onError( $YTPlayer, err );
								}
							}
						} );
					} );
				} );

				$YTPlayer.off( "YTPTime.mask" );

				jQuery.mbYTPlayer.applyMask( YTPlayer );

			} );
		},
		/**
		 *
		 * @param YTPlayer
		 */
		getDataFromAPI: function( YTPlayer ) {
			YTPlayer.videoData = jQuery.mbStorage.get( "YTPlayer_data_" + YTPlayer.videoID );
			jQuery( YTPlayer ).off( "YTPData.YTPlayer" ).on( "YTPData.YTPlayer", function() {
				if( YTPlayer.hasData ) {

					if( YTPlayer.isPlayer && !YTPlayer.opt.autoPlay ) {
						var bgndURL = YTPlayer.videoData.thumb_max || YTPlayer.videoData.thumb_high || YTPlayer.videoData.thumb_medium;
						YTPlayer.opt.containment.css( {
							background: "rgba(0,0,0,0.5) url(" + bgndURL + ") center center",
							backgroundSize: "cover"
						} );
						YTPlayer.opt.backgroundUrl = bgndURL;
					}
				}
			} );

			if( YTPlayer.videoData ) {

				setTimeout( function() {
					YTPlayer.opt.ratio = YTPlayer.opt.ratio == "auto" ? "16/9" : YTPlayer.opt.ratio;
					YTPlayer.dataReceived = true;
					jQuery( YTPlayer ).trigger( "YTPChanged" );
					var YTPData = jQuery.Event( "YTPData" );
					YTPData.prop = {};
					for( var x in YTPlayer.videoData ) YTPData.prop[ x ] = YTPlayer.videoData[ x ];
					jQuery( YTPlayer ).trigger( YTPData );
				}, 500 );

				YTPlayer.hasData = true;
			} else if( jQuery.mbYTPlayer.apiKey ) {
				// Get video info from API3 (needs api key)
				// snippet,player,contentDetails,statistics,status
				jQuery.getJSON( jQuery.mbYTPlayer.locationProtocol + "//www.googleapis.com/youtube/v3/videos?id=" + YTPlayer.videoID + "&key=" + jQuery.mbYTPlayer.apiKey + "&part=snippet", function( data ) {
					YTPlayer.dataReceived = true;
					jQuery( YTPlayer ).trigger( "YTPChanged" );

					function parseYTPlayer_data( data ) {
						YTPlayer.videoData = {};
						YTPlayer.videoData.id = YTPlayer.videoID;
						YTPlayer.videoData.channelTitle = data.channelTitle;
						YTPlayer.videoData.title = data.title;
						YTPlayer.videoData.description = data.description.length < 400 ? data.description : data.description.substring( 0, 400 ) + " ...";
						YTPlayer.videoData.aspectratio = YTPlayer.opt.ratio == "auto" ? "16/9" : YTPlayer.opt.ratio;
						YTPlayer.opt.ratio = YTPlayer.videoData.aspectratio;
						YTPlayer.videoData.thumb_max = data.thumbnails.maxres ? data.thumbnails.maxres.url : null;
						YTPlayer.videoData.thumb_high = data.thumbnails.high ? data.thumbnails.high.url : null;
						YTPlayer.videoData.thumb_medium = data.thumbnails.medium ? data.thumbnails.medium.url : null;
						jQuery.mbStorage.set( "YTPlayer_data_" + YTPlayer.videoID, YTPlayer.videoData );
					}
					parseYTPlayer_data( data.items[ 0 ].snippet );
					YTPlayer.hasData = true;
					var YTPData = jQuery.Event( "YTPData" );
					YTPData.prop = {};
					for( var x in YTPlayer.videoData ) YTPData.prop[ x ] = YTPlayer.videoData[ x ];
					jQuery( YTPlayer ).trigger( YTPData );
				} );
			} else {
				setTimeout( function() {
					jQuery( YTPlayer ).trigger( "YTPChanged" );
				}, 50 );
				if( YTPlayer.isPlayer && !YTPlayer.opt.autoPlay ) {
					var bgndURL = jQuery.mbYTPlayer.locationProtocol + "//i.ytimg.com/vi/" + YTPlayer.videoID + "/hqdefault.jpg";
					YTPlayer.opt.containment.css( {
						background: "rgba(0,0,0,0.5) url(" + bgndURL + ") center center",
						backgroundSize: "cover"
					} );
					YTPlayer.opt.backgroundUrl = bgndURL;
				}
				YTPlayer.videoData = null;
				YTPlayer.opt.ratio = YTPlayer.opt.ratio == "auto" ? "16/9" : YTPlayer.opt.ratio;
			}
			if( YTPlayer.isPlayer && !YTPlayer.opt.autoPlay && !jQuery.browser.mobile ) {
				YTPlayer.loading = jQuery( "<div/>" ).addClass( "loading" ).html( "Loading" ).hide();
				jQuery( YTPlayer ).append( YTPlayer.loading );
				YTPlayer.loading.fadeIn();
			}
		},
		/**
		 *
		 */
		removeStoredData: function() {
			jQuery.mbStorage.remove();
		},
		/**
		 *
		 * @returns {*|YTPlayer.videoData}
		 */
		getVideoData: function() {
			var YTPlayer = this.get( 0 );
			return YTPlayer.videoData;
		},
		/**
		 *
		 * @returns {*|YTPlayer.videoID|boolean}
		 */
		getVideoID: function() {
			var YTPlayer = this.get( 0 );
			return YTPlayer.videoID || false;
		},
		/**
		 *
		 * @param quality
		 */
		setVideoQuality: function( quality ) {
			var YTPlayer = this.get( 0 );
			//if( !jQuery.browser.chrome )
			YTPlayer.player.setPlaybackQuality( quality );
		},
		/**
		 *
		 * @param videos
		 * @param shuffle
		 * @param callback
		 * @param loopList
		 * @returns {jQuery.mbYTPlayer}
		 */
		playlist: function( videos, shuffle, callback, loopList ) {
			var $YTPlayer = this;
			var YTPlayer = $YTPlayer.get( 0 );
			YTPlayer.isPlayList = true;
			if( shuffle ) videos = jQuery.shuffle( videos );
			if( !YTPlayer.videoID ) {
				YTPlayer.videos = videos;
				YTPlayer.videoCounter = 0;
				YTPlayer.videoLength = videos.length;
				jQuery( YTPlayer ).data( "property", videos[ 0 ] );
				jQuery( YTPlayer ).mb_YTPlayer();
			}
			if( typeof callback == "function" ) jQuery( YTPlayer ).one( "YTPChanged", function() {
				callback( YTPlayer );
			} );
			jQuery( YTPlayer ).on( "YTPEnd", function() {
				loopList = typeof loopList == "undefined" ? true : loopList;
				jQuery( YTPlayer ).playNext( loopList );
			} );
			return $YTPlayer;
		},
		/**
		 *
		 * @returns {jQuery.mbYTPlayer}
		 */
		playNext: function( loopList ) {
			var YTPlayer = this.get( 0 );

			if( YTPlayer.checkForStartAt ) {
				clearTimeout( YTPlayer.checkForStartAt );
				clearInterval( YTPlayer.getState );
			}

			YTPlayer.videoCounter++;
			if( YTPlayer.videoCounter >= YTPlayer.videoLength && loopList )
				YTPlayer.videoCounter = 0;

			if( YTPlayer.videoCounter < YTPlayer.videoLength )
				jQuery( YTPlayer ).changeMovie( YTPlayer.videos[ YTPlayer.videoCounter ] );
			else
				YTPlayer.videoCounter--;

			return this;
		},
		/**
		 *
		 * @returns {jQuery.mbYTPlayer}
		 */
		playPrev: function() {
			var YTPlayer = this.get( 0 );

			if( YTPlayer.checkForStartAt ) {
				clearInterval( YTPlayer.checkForStartAt );
				clearInterval( YTPlayer.getState );
			}

			YTPlayer.videoCounter--;
			if( YTPlayer.videoCounter < 0 ) YTPlayer.videoCounter = YTPlayer.videoLength - 1;
			jQuery( YTPlayer ).changeMovie( YTPlayer.videos[ YTPlayer.videoCounter ] );
			return this;
		},
		/**
		 *
		 * @returns {jQuery.mbYTPlayer}
		 */
		playIndex: function( idx ) {
			var YTPlayer = this.get( 0 );

			idx = idx - 1;

			if( YTPlayer.checkForStartAt ) {
				clearInterval( YTPlayer.checkForStartAt );
				clearInterval( YTPlayer.getState );
			}

			YTPlayer.videoCounter = idx;
			if( YTPlayer.videoCounter >= YTPlayer.videoLength - 1 )
				YTPlayer.videoCounter = YTPlayer.videoLength - 1;
			jQuery( YTPlayer ).changeMovie( YTPlayer.videos[ YTPlayer.videoCounter ] );
			return this;
		},
		/**
		 *
		 * @param opt
		 */
		changeMovie: function( opt ) {

			var $YTPlayer = this;
			var YTPlayer = $YTPlayer.get( 0 );
			YTPlayer.opt.startAt = 0;
			YTPlayer.opt.stopAt = 0;
			YTPlayer.opt.mask = false;
			YTPlayer.opt.mute = true;
			YTPlayer.hasData = false;
			YTPlayer.hasChanged = true;
			YTPlayer.player.loopTime = undefined;

			if( opt )
				jQuery.extend( YTPlayer.opt, opt ); //YTPlayer.defaultOpt,
			YTPlayer.videoID = getYTPVideoID( YTPlayer.opt.videoURL ).videoID;

			if( YTPlayer.opt.loop == "true" )
				YTPlayer.opt.loop = 9999;

			jQuery( YTPlayer.playerEl ).CSSAnimate( {
				opacity: 0
			}, 200, function() {

				var YTPChangeMovie = jQuery.Event( "YTPChangeMovie" );
				YTPChangeMovie.time = YTPlayer.currentTime;
				YTPChangeMovie.videoId = YTPlayer.videoID;
				jQuery( YTPlayer ).trigger( YTPChangeMovie );

				jQuery( YTPlayer ).YTPGetPlayer().cueVideoByUrl( encodeURI( jQuery.mbYTPlayer.locationProtocol + "//www.youtube.com/v/" + YTPlayer.videoID ), 1, YTPlayer.opt.quality );
				jQuery( YTPlayer ).optimizeDisplay();

				jQuery.mbYTPlayer.checkForState( YTPlayer );
				jQuery.mbYTPlayer.getDataFromAPI( YTPlayer );

			} );

			jQuery.mbYTPlayer.applyMask( YTPlayer );
		},
		/**
		 *
		 * @returns {player}
		 */
		getPlayer: function() {
			return jQuery( this ).get( 0 ).player;
		},

		playerDestroy: function() {
			var YTPlayer = this.get( 0 );
			ytp.YTAPIReady = true;
			ytp.backgroundIsInited = false;
			YTPlayer.isInit = false;
			YTPlayer.videoID = null;
			var playerBox = YTPlayer.wrapper;
			playerBox.remove();
			jQuery( "#controlBar_" + YTPlayer.id ).remove();
			clearInterval( YTPlayer.checkForStartAt );
			clearInterval( YTPlayer.getState );
			return this;
		},

		/**
		 *
		 * @param real
		 * @returns {jQuery.mbYTPlayer}
		 */
		fullscreen: function( real ) {
			var YTPlayer = this.get( 0 );
			if( typeof real == "undefined" ) real = YTPlayer.opt.realfullscreen;
			real = eval( real );
			var controls = jQuery( "#controlBar_" + YTPlayer.id );
			var fullScreenBtn = controls.find( ".mb_OnlyYT" );
			var videoWrapper = YTPlayer.isSelf ? YTPlayer.opt.containment : YTPlayer.wrapper;
			//var videoWrapper = YTPlayer.wrapper;
			if( real ) {
				var fullscreenchange = jQuery.browser.mozilla ? "mozfullscreenchange" : jQuery.browser.webkit ? "webkitfullscreenchange" : "fullscreenchange";
				jQuery( document ).off( fullscreenchange ).on( fullscreenchange, function() {
					var isFullScreen = RunPrefixMethod( document, "IsFullScreen" ) || RunPrefixMethod( document, "FullScreen" );
					if( !isFullScreen ) {
						YTPlayer.isAlone = false;
						fullScreenBtn.html( jQuery.mbYTPlayer.controls.onlyYT );
						jQuery( YTPlayer ).YTPSetVideoQuality( YTPlayer.opt.quality );
						videoWrapper.removeClass( "YTPFullscreen" );
						videoWrapper.CSSAnimate( {
							opacity: YTPlayer.opt.opacity
						}, 500 );
						videoWrapper.css( {
							zIndex: 0
						} );
						if( YTPlayer.isBackground ) {
							jQuery( "body" ).after( controls );
						} else {
							YTPlayer.wrapper.before( controls );
						}
						jQuery( window ).resize();
						jQuery( YTPlayer ).trigger( "YTPFullScreenEnd" );
					} else {
						jQuery( YTPlayer ).YTPSetVideoQuality( "default" );
						jQuery( YTPlayer ).trigger( "YTPFullScreenStart" );
					}
				} );
			}
			if( !YTPlayer.isAlone ) {
				function hideMouse() {
					YTPlayer.overlay.css( {
						cursor: "none"
					} );
				}
				jQuery( document ).on( "mousemove.YTPlayer", function( e ) {
					YTPlayer.overlay.css( {
						cursor: "auto"
					} );
					clearTimeout( YTPlayer.hideCursor );
					if( !jQuery( e.target ).parents().is( ".mb_YTPBar" ) ) YTPlayer.hideCursor = setTimeout( hideMouse, 3000 );
				} );
				hideMouse();
				if( real ) {
					videoWrapper.css( {
						opacity: 0
					} );
					videoWrapper.addClass( "YTPFullscreen" );
					launchFullscreen( videoWrapper.get( 0 ) );
					setTimeout( function() {
						videoWrapper.CSSAnimate( {
							opacity: 1
						}, 1000 );
						YTPlayer.wrapper.append( controls );
						jQuery( YTPlayer ).optimizeDisplay();
						YTPlayer.player.seekTo( YTPlayer.player.getCurrentTime() + .1, true );
					}, 500 )
				} else videoWrapper.css( {
					zIndex: 10000
				} ).CSSAnimate( {
					opacity: 1
				}, 1000 );
				fullScreenBtn.html( jQuery.mbYTPlayer.controls.showSite );
				YTPlayer.isAlone = true;
			} else {
				jQuery( document ).off( "mousemove.YTPlayer" );
				clearTimeout( YTPlayer.hideCursor );
				YTPlayer.overlay.css( {
					cursor: "auto"
				} );
				if( real ) {
					cancelFullscreen();
				} else {
					videoWrapper.CSSAnimate( {
						opacity: YTPlayer.opt.opacity
					}, 500 );
					videoWrapper.css( {
						zIndex: 0
					} );
				}
				fullScreenBtn.html( jQuery.mbYTPlayer.controls.onlyYT );
				YTPlayer.isAlone = false;
			}

			function RunPrefixMethod( obj, method ) {
				var pfx = [ "webkit", "moz", "ms", "o", "" ];
				var p = 0,
					m, t;
				while( p < pfx.length && !obj[ m ] ) {
					m = method;
					if( pfx[ p ] == "" ) {
						m = m.substr( 0, 1 ).toLowerCase() + m.substr( 1 );
					}
					m = pfx[ p ] + m;
					t = typeof obj[ m ];
					if( t != "undefined" ) {
						pfx = [ pfx[ p ] ];
						return( t == "function" ? obj[ m ]() : obj[ m ] );
					}
					p++;
				}
			}

			function launchFullscreen( element ) {
				RunPrefixMethod( element, "RequestFullScreen" );
			}

			function cancelFullscreen() {
				if( RunPrefixMethod( document, "FullScreen" ) || RunPrefixMethod( document, "IsFullScreen" ) ) {
					RunPrefixMethod( document, "CancelFullScreen" );
				}
			}
			return this;
		},
		/**
		 *
		 * @returns {jQuery.mbYTPlayer}
		 */
		toggleLoops: function() {
			var YTPlayer = this.get( 0 );
			var data = YTPlayer.opt;
			if( data.loop == 1 ) {
				data.loop = 0;
			} else {
				if( data.startAt ) {
					YTPlayer.player.seekTo( data.startAt );
				} else {
					YTPlayer.player.playVideo();
				}
				data.loop = 1;
			}
			return this;
		},
		/**
		 *
		 * @returns {jQuery.mbYTPlayer}
		 */
		play: function() {
			var YTPlayer = this.get( 0 );
			if( !YTPlayer.isReady )
				return this;

			YTPlayer.player.playVideo();
			YTPlayer.wrapper.CSSAnimate( {
				opacity: YTPlayer.isAlone ? 1 : YTPlayer.opt.opacity
			}, 2000 );

			jQuery( YTPlayer.playerEl ).CSSAnimate( {
				opacity: 1
			}, 1000 );

			var controls = jQuery( "#controlBar_" + YTPlayer.id );
			var playBtn = controls.find( ".mb_YTPPlaypause" );
			playBtn.html( jQuery.mbYTPlayer.controls.pause );
			YTPlayer.state = 1;

			jQuery( YTPlayer ).css( "background-image", "none" );
			return this;
		},
		/**
		 *
		 * @param callback
		 * @returns {jQuery.mbYTPlayer}
		 */
		togglePlay: function( callback ) {
			var YTPlayer = this.get( 0 );
			if( YTPlayer.state == 1 )
				this.YTPPause();
			else
				this.YTPPlay();

			if( typeof callback == "function" )
				callback( YTPlayer.state );

			return this;
		},
		/**
		 *
		 * @returns {jQuery.mbYTPlayer}
		 */
		stop: function() {
			var YTPlayer = this.get( 0 );
			var controls = jQuery( "#controlBar_" + YTPlayer.id );
			var playBtn = controls.find( ".mb_YTPPlaypause" );
			playBtn.html( jQuery.mbYTPlayer.controls.play );
			YTPlayer.player.stopVideo();
			return this;
		},
		/**
		 *
		 * @returns {jQuery.mbYTPlayer}
		 */
		pause: function() {
			var YTPlayer = this.get( 0 );
			YTPlayer.player.pauseVideo();
			YTPlayer.state = 2;
			return this;
		},
		/**
		 *
		 * @param val
		 * @returns {jQuery.mbYTPlayer}
		 */
		seekTo: function( val ) {
			var YTPlayer = this.get( 0 );
			YTPlayer.player.seekTo( val, true );
			return this;
		},
		/**
		 *
		 * @param val
		 * @returns {jQuery.mbYTPlayer}
		 */
		setVolume: function( val ) {
			var YTPlayer = this.get( 0 );
			if( !val && !YTPlayer.opt.vol && YTPlayer.player.getVolume() == 0 ) jQuery( YTPlayer ).YTPUnmute();
			else if( ( !val && YTPlayer.player.getVolume() > 0 ) || ( val && YTPlayer.opt.vol == val ) ) {
				if( !YTPlayer.isMute ) jQuery( YTPlayer ).YTPMute();
				else jQuery( YTPlayer ).YTPUnmute();
			} else {
				YTPlayer.opt.vol = val;
				YTPlayer.player.setVolume( YTPlayer.opt.vol );
				if( YTPlayer.volumeBar && YTPlayer.volumeBar.length ) YTPlayer.volumeBar.updateSliderVal( val )
			}
			return this;
		},
		/**
		 *
		 * @returns {boolean}
		 */
		toggleVolume: function() {
			var YTPlayer = this.get( 0 );
			if( !YTPlayer ) return;
			if( YTPlayer.player.isMuted() ) {
				jQuery( YTPlayer ).YTPUnmute();
				return true;
			} else {
				jQuery( YTPlayer ).YTPMute();
				return false;
			}
		},
		/**
		 *
		 * @returns {jQuery.mbYTPlayer}
		 */
		mute: function() {
			var YTPlayer = this.get( 0 );
			if( YTPlayer.isMute ) return;
			YTPlayer.player.mute();
			YTPlayer.isMute = true;
			YTPlayer.player.setVolume( 0 );
			if( YTPlayer.volumeBar && YTPlayer.volumeBar.length && YTPlayer.volumeBar.width() > 10 ) {
				YTPlayer.volumeBar.updateSliderVal( 0 );
			}
			var controls = jQuery( "#controlBar_" + YTPlayer.id );
			var muteBtn = controls.find( ".mb_YTPMuteUnmute" );
			muteBtn.html( jQuery.mbYTPlayer.controls.unmute );
			jQuery( YTPlayer ).addClass( "isMuted" );
			if( YTPlayer.volumeBar && YTPlayer.volumeBar.length ) YTPlayer.volumeBar.addClass( "muted" );
			var YTPEvent = jQuery.Event( "YTPMuted" );
			YTPEvent.time = YTPlayer.currentTime;
			if( YTPlayer.canTrigger ) jQuery( YTPlayer ).trigger( YTPEvent );
			return this;
		},
		/**
		 *
		 * @returns {jQuery.mbYTPlayer}
		 */
		unmute: function() {
			var YTPlayer = this.get( 0 );
			if( !YTPlayer.isMute ) return;
			YTPlayer.player.unMute();
			YTPlayer.isMute = false;
			YTPlayer.player.setVolume( YTPlayer.opt.vol );
			if( YTPlayer.volumeBar && YTPlayer.volumeBar.length ) YTPlayer.volumeBar.updateSliderVal( YTPlayer.opt.vol > 10 ? YTPlayer.opt.vol : 10 );
			var controls = jQuery( "#controlBar_" + YTPlayer.id );
			var muteBtn = controls.find( ".mb_YTPMuteUnmute" );
			muteBtn.html( jQuery.mbYTPlayer.controls.mute );
			jQuery( YTPlayer ).removeClass( "isMuted" );
			if( YTPlayer.volumeBar && YTPlayer.volumeBar.length ) YTPlayer.volumeBar.removeClass( "muted" );
			var YTPEvent = jQuery.Event( "YTPUnmuted" );
			YTPEvent.time = YTPlayer.currentTime;
			if( YTPlayer.canTrigger ) jQuery( YTPlayer ).trigger( YTPEvent );
			return this;
		},
		/**
		 * FILTERS
		 *
		 *
		 * @param filter
		 * @param value
		 * @returns {jQuery.mbYTPlayer}
		 */
		applyFilter: function( filter, value ) {
			return this.each( function() {
				var YTPlayer = this;
				YTPlayer.filters[ filter ].value = value;
				if( YTPlayer.filtersEnabled )
					jQuery( YTPlayer ).YTPEnableFilters();
			} );
		},
		/**
		 *
		 * @param filters
		 * @returns {jQuery.mbYTPlayer}
		 */
		applyFilters: function( filters ) {
			return this.each( function() {
				var YTPlayer = this;
				if( !YTPlayer.isReady ) {
					jQuery( YTPlayer ).on( "YTPReady", function() {
						jQuery( YTPlayer ).YTPApplyFilters( filters );
					} );
					return;
				}

				for( var key in filters )
					jQuery( YTPlayer ).YTPApplyFilter( key, filters[ key ] );

				jQuery( YTPlayer ).trigger( "YTPFiltersApplied" );
			} );
		},
		/**
		 *
		 * @param filter
		 * @param value
		 * @returns {*}
		 */
		toggleFilter: function( filter, value ) {
			return this.each( function() {
				var YTPlayer = this;
				if( !YTPlayer.filters[ filter ].value ) YTPlayer.filters[ filter ].value = value;
				else YTPlayer.filters[ filter ].value = 0;
				if( YTPlayer.filtersEnabled ) jQuery( this ).YTPEnableFilters();
			} );
		},
		/**
		 *
		 * @param callback
		 * @returns {*}
		 */
		toggleFilters: function( callback ) {
			return this.each( function() {
				var YTPlayer = this;
				if( YTPlayer.filtersEnabled ) {
					jQuery( YTPlayer ).trigger( "YTPDisableFilters" );
					jQuery( YTPlayer ).YTPDisableFilters();
				} else {
					jQuery( YTPlayer ).YTPEnableFilters();
					jQuery( YTPlayer ).trigger( "YTPEnableFilters" );
				}
				if( typeof callback == "function" )
					callback( YTPlayer.filtersEnabled );
			} )
		},
		/**
		 *
		 * @returns {*}
		 */
		disableFilters: function() {
			return this.each( function() {
				var YTPlayer = this;
				var iframe = jQuery( YTPlayer.playerEl );
				iframe.css( "-webkit-filter", "" );
				iframe.css( "filter", "" );
				YTPlayer.filtersEnabled = false;
			} )
		},
		/**
		 *
		 * @returns {*}
		 */
		enableFilters: function() {
			return this.each( function() {
				var YTPlayer = this;
				var iframe = jQuery( YTPlayer.playerEl );
				var filterStyle = "";
				for( var key in YTPlayer.filters ) {
					if( YTPlayer.filters[ key ].value )
						filterStyle += key.replace( "_", "-" ) + "(" + YTPlayer.filters[ key ].value + YTPlayer.filters[ key ].unit + ") ";
				}
				iframe.css( "-webkit-filter", filterStyle );
				iframe.css( "filter", filterStyle );
				YTPlayer.filtersEnabled = true;
			} );
		},
		/**
		 *
		 * @param filter
		 * @param callback
		 * @returns {*}
		 */
		removeFilter: function( filter, callback ) {
			return this.each( function() {
				var YTPlayer = this;
				if( typeof filter == "function" ) {
					callback = filter;
					filter = null;
				}
				if( !filter )
					for( var key in YTPlayer.filters ) {
						jQuery( this ).YTPApplyFilter( key, 0 );
						if( typeof callback == "function" ) callback( key );
					} else {
						jQuery( this ).YTPApplyFilter( filter, 0 );
						if( typeof callback == "function" ) callback( filter );
					}
			} );

		},
		/**
		 *
		 * @returns {*}
		 */
		getFilters: function() {
			var YTPlayer = this.get( 0 );
			return YTPlayer.filters;
		},
		/**
		 * MASK
		 *
		 *
		 * @param mask
		 * @returns {jQuery.mbYTPlayer}
		 */
		addMask: function( mask ) {
			var YTPlayer = this.get( 0 );
			var overlay = YTPlayer.overlay;

			if( !mask ) {
				mask = YTPlayer.actualMask;
			}

			var tempImg = jQuery( "<img/>" ).attr( "src", mask ).on( "load", function() {

				overlay.CSSAnimate( {
					opacity: 0
				}, 500, function() {

					YTPlayer.hasMask = true;

					tempImg.remove();

					overlay.css( {
						backgroundImage: "url(" + mask + ")",
						backgroundRepeat: "no-repeat",
						backgroundPosition: "center center",
						backgroundSize: "cover"
					} );

					overlay.CSSAnimate( {
						opacity: 1
					}, 500 );

				} );

			} );

			return this;

		},
		/**
		 *
		 * @returns {jQuery.mbYTPlayer}
		 */
		removeMask: function() {
			var YTPlayer = this.get( 0 );
			var overlay = YTPlayer.overlay;
			overlay.CSSAnimate( {
				opacity: 0
			}, 500, function() {

				YTPlayer.hasMask = false;

				overlay.css( {
					backgroundImage: "",
					backgroundRepeat: "",
					backgroundPosition: "",
					backgroundSize: ""
				} );
				overlay.CSSAnimate( {
					opacity: 1
				}, 500 );

			} );

			return this;

		},
		/**
		 *
		 * @param YTPlayer
		 */
		applyMask: function( YTPlayer ) {
			var $YTPlayer = jQuery( YTPlayer );
			$YTPlayer.off( "YTPTime.mask" );

			if( YTPlayer.opt.mask ) {

				if( typeof YTPlayer.opt.mask == "string" ) {
					$YTPlayer.YTPAddMask( YTPlayer.opt.mask );

					YTPlayer.actualMask = YTPlayer.opt.mask;

				} else if( typeof YTPlayer.opt.mask == "object" ) {

					for( var time in YTPlayer.opt.mask ) {
						if( YTPlayer.opt.mask[ time ] )
							var img = jQuery( "<img/>" ).attr( "src", YTPlayer.opt.mask[ time ] );
					}

					if( YTPlayer.opt.mask[ 0 ] )
						$YTPlayer.YTPAddMask( YTPlayer.opt.mask[ 0 ] );

					$YTPlayer.on( "YTPTime.mask", function( e ) {
						for( var time in YTPlayer.opt.mask ) {
							if( e.time == time )
								if( !YTPlayer.opt.mask[ time ] ) {
									$YTPlayer.YTPRemoveMask();
								} else {

									$YTPlayer.YTPAddMask( YTPlayer.opt.mask[ time ] );
									YTPlayer.actualMask = YTPlayer.opt.mask[ time ];
								}

						}
					} );

				}


			}
		},
		/**
		 *
		 */
		toggleMask: function() {
			var YTPlayer = this.get( 0 );
			var $YTPlayer = $( YTPlayer );
			if( YTPlayer.hasMask )
				$YTPlayer.YTPRemoveMask();
			else
				$YTPlayer.YTPAddMask();

			return this;
		},
		/**
		 *
		 * @returns {{totalTime: number, currentTime: number}}
		 */
		manageProgress: function() {
			var YTPlayer = this.get( 0 );
			var controls = jQuery( "#controlBar_" + YTPlayer.id );
			var progressBar = controls.find( ".mb_YTPProgress" );
			var loadedBar = controls.find( ".mb_YTPLoaded" );
			var timeBar = controls.find( ".mb_YTPseekbar" );
			var totW = progressBar.outerWidth();
			var currentTime = Math.floor( YTPlayer.player.getCurrentTime() );
			var totalTime = Math.floor( YTPlayer.player.getDuration() );
			var timeW = ( currentTime * totW ) / totalTime;
			var startLeft = 0;
			var loadedW = YTPlayer.player.getVideoLoadedFraction() * 100;
			loadedBar.css( {
				left: startLeft,
				width: loadedW + "%"
			} );
			timeBar.css( {
				left: 0,
				width: timeW
			} );
			return {
				totalTime: totalTime,
				currentTime: currentTime
			};
		},
		/**
		 *
		 * @param YTPlayer
		 */
		buildControls: function( YTPlayer ) {
			var data = YTPlayer.opt;
			// @data.printUrl: is deprecated; use data.showYTLogo
			data.showYTLogo = data.showYTLogo || data.printUrl;

			if( jQuery( "#controlBar_" + YTPlayer.id ).length )
				return;
			YTPlayer.controlBar = jQuery( "<span/>" ).attr( "id", "controlBar_" + YTPlayer.id ).addClass( "mb_YTPBar" ).css( {
				whiteSpace: "noWrap",
				position: YTPlayer.isBackground ? "fixed" : "absolute",
				zIndex: YTPlayer.isBackground ? 10000 : 1000
			} ).hide();
			var buttonBar = jQuery( "<div/>" ).addClass( "buttonBar" );
			/* play/pause button*/
			var playpause = jQuery( "<span>" + jQuery.mbYTPlayer.controls.play + "</span>" ).addClass( "mb_YTPPlaypause ytpicon" ).click( function() {
				if( YTPlayer.player.getPlayerState() == 1 ) jQuery( YTPlayer ).YTPPause();
				else jQuery( YTPlayer ).YTPPlay();
			} );
			/* mute/unmute button*/
			var MuteUnmute = jQuery( "<span>" + jQuery.mbYTPlayer.controls.mute + "</span>" ).addClass( "mb_YTPMuteUnmute ytpicon" ).click( function() {
				if( YTPlayer.player.getVolume() == 0 ) {
					jQuery( YTPlayer ).YTPUnmute();
				} else {
					jQuery( YTPlayer ).YTPMute();
				}
			} );
			/* volume bar*/
			var volumeBar = jQuery( "<div/>" ).addClass( "mb_YTPVolumeBar" ).css( {
				display: "inline-block"
			} );
			YTPlayer.volumeBar = volumeBar;
			/* time elapsed */
			var idx = jQuery( "<span/>" ).addClass( "mb_YTPTime" );
			var vURL = data.videoURL ? data.videoURL : "";
			if( vURL.indexOf( "http" ) < 0 ) vURL = jQuery.mbYTPlayer.locationProtocol + "//www.youtube.com/watch?v=" + data.videoURL;
			var movieUrl = jQuery( "<span/>" ).html( jQuery.mbYTPlayer.controls.ytLogo ).addClass( "mb_YTPUrl ytpicon" ).attr( "title", "view on YouTube" ).on( "click", function() {
				window.open( vURL, "viewOnYT" )
			} );
			var onlyVideo = jQuery( "<span/>" ).html( jQuery.mbYTPlayer.controls.onlyYT ).addClass( "mb_OnlyYT ytpicon" ).on( "click", function() {
				jQuery( YTPlayer ).YTPFullscreen( data.realfullscreen );
			} );
			var progressBar = jQuery( "<div/>" ).addClass( "mb_YTPProgress" ).css( "position", "absolute" ).click( function( e ) {
				timeBar.css( {
					width: ( e.clientX - timeBar.offset().left )
				} );
				YTPlayer.timeW = e.clientX - timeBar.offset().left;
				YTPlayer.controlBar.find( ".mb_YTPLoaded" ).css( {
					width: 0
				} );
				var totalTime = Math.floor( YTPlayer.player.getDuration() );
				YTPlayer.goto = ( timeBar.outerWidth() * totalTime ) / progressBar.outerWidth();
				YTPlayer.player.seekTo( parseFloat( YTPlayer.goto ), true );
				YTPlayer.controlBar.find( ".mb_YTPLoaded" ).css( {
					width: 0
				} );
			} );
			var loadedBar = jQuery( "<div/>" ).addClass( "mb_YTPLoaded" ).css( "position", "absolute" );
			var timeBar = jQuery( "<div/>" ).addClass( "mb_YTPseekbar" ).css( "position", "absolute" );
			progressBar.append( loadedBar ).append( timeBar );
			buttonBar.append( playpause ).append( MuteUnmute ).append( volumeBar ).append( idx );
			if( data.showYTLogo ) {
				buttonBar.append( movieUrl );
			}
			if( YTPlayer.isBackground || ( eval( YTPlayer.opt.realfullscreen ) && !YTPlayer.isBackground ) ) buttonBar.append( onlyVideo );
			YTPlayer.controlBar.append( buttonBar ).append( progressBar );
			if( !YTPlayer.isBackground ) {
				YTPlayer.controlBar.addClass( "inlinePlayer" );
				YTPlayer.wrapper.before( YTPlayer.controlBar );
			} else {
				jQuery( "body" ).after( YTPlayer.controlBar );
			}
			volumeBar.simpleSlider( {
				initialval: YTPlayer.opt.vol,
				scale: 100,
				orientation: "h",
				callback: function( el ) {
					if( el.value == 0 ) {
						jQuery( YTPlayer ).YTPMute();
					} else {
						jQuery( YTPlayer ).YTPUnmute();
					}
					YTPlayer.player.setVolume( el.value );
					if( !YTPlayer.isMute ) YTPlayer.opt.vol = el.value;
				}
			} );
		},
		/**
		 *
		 * @param YTPlayer
		 */
		checkForState: function( YTPlayer ) {
			var interval = YTPlayer.opt.showControls ? 100 : 400;
			clearInterval( YTPlayer.getState );
			//Checking if player has been removed from scene
			if( !jQuery.contains( document, YTPlayer ) ) {
				jQuery( YTPlayer ).YTPPlayerDestroy();
				clearInterval( YTPlayer.getState );
				clearInterval( YTPlayer.checkForStartAt );
				return;
			}

			jQuery.mbYTPlayer.checkForStart( YTPlayer );

			YTPlayer.getState = setInterval( function() {
				var prog = jQuery( YTPlayer ).YTPManageProgress();
				var $YTPlayer = jQuery( YTPlayer );
				var data = YTPlayer.opt;
				var startAt = YTPlayer.opt.startAt ? YTPlayer.opt.startAt : 1;
				var stopAt = YTPlayer.opt.stopAt > YTPlayer.opt.startAt ? YTPlayer.opt.stopAt : 0;
				stopAt = stopAt < YTPlayer.player.getDuration() ? stopAt : 0;
				if( YTPlayer.currentTime != prog.currentTime ) {

					var YTPEvent = jQuery.Event( "YTPTime" );
					YTPEvent.time = YTPlayer.currentTime;
					jQuery( YTPlayer ).trigger( YTPEvent );

				}
				YTPlayer.currentTime = prog.currentTime;
				YTPlayer.totalTime = YTPlayer.player.getDuration();
				if( YTPlayer.player.getVolume() == 0 ) $YTPlayer.addClass( "isMuted" );
				else $YTPlayer.removeClass( "isMuted" );

				if( YTPlayer.opt.showControls )
					if( prog.totalTime ) {
						YTPlayer.controlBar.find( ".mb_YTPTime" ).html( jQuery.mbYTPlayer.formatTime( prog.currentTime ) + " / " + jQuery.mbYTPlayer.formatTime( prog.totalTime ) );
					} else {
						YTPlayer.controlBar.find( ".mb_YTPTime" ).html( "-- : -- / -- : --" );
					}

				if( eval( YTPlayer.opt.stopMovieOnBlur ) ) {
					if( !document.hasFocus() ) {
						if( YTPlayer.state == 1 ) {
							YTPlayer.hasFocus = false;
							$YTPlayer.YTPPause();
						}
					} else if( document.hasFocus() && !YTPlayer.hasFocus && !( YTPlayer.state == -1 || YTPlayer.state == 0 ) ) {
						YTPlayer.hasFocus = true;
						$YTPlayer.YTPPlay();
					}
				}

				if( YTPlayer.controlBar.length && YTPlayer.controlBar.outerWidth() <= 400 && !YTPlayer.isCompact ) {
					YTPlayer.controlBar.addClass( "compact" );
					YTPlayer.isCompact = true;
					if( !YTPlayer.isMute && YTPlayer.volumeBar ) YTPlayer.volumeBar.updateSliderVal( YTPlayer.opt.vol );
				} else if( YTPlayer.controlBar.length && YTPlayer.controlBar.outerWidth() > 400 && YTPlayer.isCompact ) {
					YTPlayer.controlBar.removeClass( "compact" );
					YTPlayer.isCompact = false;
					if( !YTPlayer.isMute && YTPlayer.volumeBar ) YTPlayer.volumeBar.updateSliderVal( YTPlayer.opt.vol );
				}
				if( YTPlayer.player.getPlayerState() == 1 && ( parseFloat( YTPlayer.player.getDuration() - 1.5 ) < YTPlayer.player.getCurrentTime() || ( stopAt > 0 && parseFloat( YTPlayer.player.getCurrentTime() ) > stopAt ) ) ) {
					if( YTPlayer.isEnded ) return;
					YTPlayer.isEnded = true;
					setTimeout( function() {
						YTPlayer.isEnded = false
					}, 1000 );

					if( YTPlayer.isPlayList ) {

						if( !data.loop || ( data.loop > 0 && YTPlayer.player.loopTime === data.loop - 1 ) ) {

							YTPlayer.player.loopTime = undefined;
							clearInterval( YTPlayer.getState );
							var YTPEnd = jQuery.Event( "YTPEnd" );
							YTPEnd.time = YTPlayer.currentTime;
							jQuery( YTPlayer ).trigger( YTPEnd );
							//YTPlayer.state = 0;

							return;
						}

					} else if( !data.loop || ( data.loop > 0 && YTPlayer.player.loopTime === data.loop - 1 ) ) {

						YTPlayer.player.loopTime = undefined;
						YTPlayer.preventTrigger = true;
						YTPlayer.state = 2;
						jQuery( YTPlayer ).YTPPause();

						YTPlayer.wrapper.CSSAnimate( {
							opacity: 0
						}, 500, function() {

							if( YTPlayer.controlBar.length )
								YTPlayer.controlBar.find( ".mb_YTPPlaypause" ).html( jQuery.mbYTPlayer.controls.play );

							var YTPEnd = jQuery.Event( "YTPEnd" );
							YTPEnd.time = YTPlayer.currentTime;
							jQuery( YTPlayer ).trigger( YTPEnd );

							YTPlayer.player.seekTo( startAt, true );
							if( !YTPlayer.isBackground ) {
								YTPlayer.opt.containment.css( {
									background: "rgba(0,0,0,0.5) url(" + YTPlayer.opt.backgroundUrl + ") center center",
									backgroundSize: "cover"
								} );
							}
						} );

						return;

					}

					YTPlayer.player.loopTime = YTPlayer.player.loopTime ? ++YTPlayer.player.loopTime : 1;
					startAt = startAt || 1;
					YTPlayer.preventTrigger = true;
					YTPlayer.state = 2;
					jQuery( YTPlayer ).YTPPause();
					YTPlayer.player.seekTo( startAt, true );
					$YTPlayer.YTPPlay();


				}
			}, interval );
		},
		/**
		 *
		 * @returns {string} time
		 */
		getTime: function() {
			var YTPlayer = this.get( 0 );
			return jQuery.mbYTPlayer.formatTime( YTPlayer.currentTime );
		},
		/**
		 *
		 * @returns {string} total time
		 */
		getTotalTime: function() {
			var YTPlayer = this.get( 0 );
			return jQuery.mbYTPlayer.formatTime( YTPlayer.totalTime );
		},
		/**
		 *
		 * @param YTPlayer
		 */
		checkForStart: function( YTPlayer ) {

			var $YTPlayer = jQuery( YTPlayer );

			//Checking if player has been removed from scene
			if( !jQuery.contains( document, YTPlayer ) ) {
				jQuery( YTPlayer ).YTPPlayerDestroy();
				return
			}

			/*
			 if( jQuery.browser.chrome )
			 YTPlayer.opt.quality = "default";
			 */

			YTPlayer.preventTrigger = true;
			YTPlayer.state = 2
			jQuery( YTPlayer ).YTPPause();

			jQuery( YTPlayer ).muteYTPVolume();
			jQuery( "#controlBar_" + YTPlayer.id ).remove();

			YTPlayer.controlBar = false;

			if( YTPlayer.opt.showControls )
				jQuery.mbYTPlayer.buildControls( YTPlayer );

			if( YTPlayer.opt.addRaster ) {

				var classN = YTPlayer.opt.addRaster == "dot" ? "raster-dot" : "raster";
				YTPlayer.overlay.addClass( YTPlayer.isRetina ? classN + " retina" : classN );

			} else {

				YTPlayer.overlay.removeClass( function( index, classNames ) {
					// change the list into an array
					var current_classes = classNames.split( " " ),
						// array of classes which are to be removed
						classes_to_remove = [];
					jQuery.each( current_classes, function( index, class_name ) {
						// if the classname begins with bg add it to the classes_to_remove array
						if( /raster.*/.test( class_name ) ) {
							classes_to_remove.push( class_name );
						}
					} );
					classes_to_remove.push( "retina" );
					// turn the array back into a string
					return classes_to_remove.join( " " );
				} )

			}

			var startAt = YTPlayer.opt.startAt ? YTPlayer.opt.startAt : 1;
			YTPlayer.player.playVideo();
			YTPlayer.player.seekTo( startAt, true );

			YTPlayer.checkForStartAt = setInterval( function() {

				jQuery( YTPlayer ).YTPMute();

				var canPlayVideo = YTPlayer.player.getVideoLoadedFraction() >= startAt / YTPlayer.player.getDuration();

				if( YTPlayer.player.getDuration() > 0 && YTPlayer.player.getCurrentTime() >= startAt && canPlayVideo ) {

					//YTPlayer.player.playVideo();
					//console.timeEnd( "checkforStart" );

					clearInterval( YTPlayer.checkForStartAt );

					if( typeof YTPlayer.opt.onReady == "function" )
						YTPlayer.opt.onReady( YTPlayer );

					YTPlayer.isReady = true;
					var YTPready = jQuery.Event( "YTPReady" );
					YTPready.time = YTPlayer.currentTime;
					jQuery( YTPlayer ).trigger( YTPready );


					YTPlayer.preventTrigger = true;
					YTPlayer.state = 2;
					jQuery( YTPlayer ).YTPPause();

					if( !YTPlayer.opt.mute ) jQuery( YTPlayer ).YTPUnmute();
					YTPlayer.canTrigger = true;

					if( YTPlayer.opt.autoPlay ) {


						var YTPStart = jQuery.Event( "YTPStart" );
						YTPStart.time = YTPlayer.currentTime;
						jQuery( YTPlayer ).trigger( YTPStart );

						$YTPlayer.css( "background-image", "none" );
						jQuery( YTPlayer.playerEl ).CSSAnimate( {
							opacity: 1
						}, 1000 );

						$YTPlayer.YTPPlay();

						YTPlayer.wrapper.CSSAnimate( {
							opacity: YTPlayer.isAlone ? 1 : YTPlayer.opt.opacity
						}, 1000 );

						/* Fix for Safari freeze */
						if( jQuery.browser.safari ) {

							YTPlayer.safariPlay = setInterval( function() {

								if( YTPlayer.state != 1 )
									$YTPlayer.YTPPlay();
								else
									clearInterval( YTPlayer.safariPlay )
							}, 10 )
						}
						$YTPlayer.on( "YTPReady", function() {
							$YTPlayer.YTPPlay();
						} );

					} else {

						//$YTPlayer.YTPPause();
						YTPlayer.player.pauseVideo();
						if( !YTPlayer.isPlayer ) {
							jQuery( YTPlayer.playerEl ).CSSAnimate( {
								opacity: 1
							}, 500 );

							YTPlayer.wrapper.CSSAnimate( {
								opacity: YTPlayer.isAlone ? 1 : YTPlayer.opt.opacity
							}, 500 );
						}

						if( YTPlayer.controlBar.length )
							YTPlayer.controlBar.find( ".mb_YTPPlaypause" ).html( jQuery.mbYTPlayer.controls.play );

					}

					if( YTPlayer.isPlayer && !YTPlayer.opt.autoPlay && ( YTPlayer.loading && YTPlayer.loading.length ) ) {
						YTPlayer.loading.html( "Ready" );
						setTimeout( function() {
							YTPlayer.loading.fadeOut();
						}, 100 )
					}

					if( YTPlayer.controlBar && YTPlayer.controlBar.length )
						YTPlayer.controlBar.slideDown( 1000 );

				} else if( jQuery.browser.safari ) {
					YTPlayer.player.playVideo();
					if( startAt >= 0 ) YTPlayer.player.seekTo( startAt, true );
				}

			}, 1 );

		},
		/**
		 *
		 * @param align
		 */
		setAlign: function( align ) {
			var $YTplayer = this;

			$YTplayer.optimizeDisplay( align );
		},
		/**
		 *
		 * @param align
		 */
		getAlign: function() {
			var YTPlayer = this.get( 0 );
			return YTPlayer.opt.align;
		},
		/**
		 *
		 * @param s
		 * @returns {string}
		 */
		formatTime: function( s ) {
			var min = Math.floor( s / 60 );
			var sec = Math.floor( s - ( 60 * min ) );
			return( min <= 9 ? "0" + min : min ) + " : " + ( sec <= 9 ? "0" + sec : sec );
		}
	};

	/**
	 *
	 * @param align
	 * can be center, top, bottom, right, left; (default is center,center)
	 */
	jQuery.fn.optimizeDisplay = function( align ) {
		var YTPlayer = this.get( 0 );
		var playerBox = jQuery( YTPlayer.playerEl );
		var vid = {};

		YTPlayer.opt.align = align || YTPlayer.opt.align;

		YTPlayer.opt.align = typeof YTPlayer.opt.align != "undefined " ? YTPlayer.opt.align : "center,center";
		var YTPAlign = YTPlayer.opt.align.split( "," );

		//data.optimizeDisplay = YTPlayer.isPlayer ? false : data.optimizeDisplay;

		if( YTPlayer.opt.optimizeDisplay ) {
			var win = {};
			var el = YTPlayer.wrapper;

			win.width = el.outerWidth();
			win.height = el.outerHeight();

			vid.width = win.width;
			vid.height = YTPlayer.opt.ratio == "16/9" ? Math.ceil( win.width * ( 9 / 16 ) ) : Math.ceil( win.width * ( 3 / 4 ) );

			vid.width = win.width;
			vid.height = YTPlayer.opt.ratio == "16/9" ? Math.ceil( win.width * ( 9 / 16 ) ) : Math.ceil( win.width * ( 3 / 4 ) );

			vid.marginTop = -( ( vid.height - win.height ) / 2 );
			vid.marginLeft = 0;

			var lowest = vid.height < win.height;

			if( lowest ) {

				vid.height = win.height;
				vid.width = YTPlayer.opt.ratio == "16/9" ? Math.floor( win.height * ( 16 / 9 ) ) : Math.floor( win.height * ( 4 / 3 ) );

				vid.marginTop = 0;
				vid.marginLeft = -( ( vid.width - win.width ) / 2 );

			}

			for( var a in YTPAlign ) {

				var al = YTPAlign[ a ].trim();

				switch( al ) {

					case "top":
						vid.marginTop = lowest ? -( ( vid.height - win.height ) / 2 ) : 0;
						break;

					case "bottom":
						vid.marginTop = lowest ? 0 : -( vid.height - win.height );
						break;

					case "left":
						vid.marginLeft = 0;
						break;

					case "right":
						vid.marginLeft = lowest ? -( vid.width - win.width ) : 0;
						break;

					default:
						break;
				}

			}

		} else {
			vid.width = "100%";
			vid.height = "100%";
			vid.marginTop = 0;
			vid.marginLeft = 0;
		}

		playerBox.css( {
			width: vid.width,
			height: vid.height,
			marginTop: vid.marginTop,
			marginLeft: vid.marginLeft
		} );

	};
	/**
	 *
	 * @param arr
	 * @returns {Array|string|Blob|*}
	 *
	 */
	jQuery.shuffle = function( arr ) {
		var newArray = arr.slice();
		var len = newArray.length;
		var i = len;
		while( i-- ) {
			var p = parseInt( Math.random() * len );
			var t = newArray[ i ];
			newArray[ i ] = newArray[ p ];
			newArray[ p ] = t;
		}
		return newArray;
	};

	jQuery.fn.unselectable = function() {
		return this.each( function() {
			jQuery( this ).css( {
				"-moz-user-select": "none",
				"-webkit-user-select": "none",
				"user-select": "none"
			} ).attr( "unselectable", "on" );
		} );
	};


	/* Exposed public method */
	jQuery.fn.YTPlayer = jQuery.mbYTPlayer.buildPlayer;
	jQuery.fn.YTPGetPlayer = jQuery.mbYTPlayer.getPlayer;
	jQuery.fn.YTPGetVideoID = jQuery.mbYTPlayer.getVideoID;
	jQuery.fn.YTPChangeMovie = jQuery.mbYTPlayer.changeMovie;
	jQuery.fn.YTPPlayerDestroy = jQuery.mbYTPlayer.playerDestroy;

	jQuery.fn.YTPPlay = jQuery.mbYTPlayer.play;
	jQuery.fn.YTPTogglePlay = jQuery.mbYTPlayer.togglePlay;
	jQuery.fn.YTPStop = jQuery.mbYTPlayer.stop;
	jQuery.fn.YTPPause = jQuery.mbYTPlayer.pause;
	jQuery.fn.YTPSeekTo = jQuery.mbYTPlayer.seekTo;

	jQuery.fn.YTPlaylist = jQuery.mbYTPlayer.playlist;
	jQuery.fn.YTPPlayNext = jQuery.mbYTPlayer.playNext;
	jQuery.fn.YTPPlayPrev = jQuery.mbYTPlayer.playPrev;
	jQuery.fn.YTPPlayIndex = jQuery.mbYTPlayer.playIndex;

	jQuery.fn.YTPMute = jQuery.mbYTPlayer.mute;
	jQuery.fn.YTPUnmute = jQuery.mbYTPlayer.unmute;
	jQuery.fn.YTPToggleVolume = jQuery.mbYTPlayer.toggleVolume;
	jQuery.fn.YTPSetVolume = jQuery.mbYTPlayer.setVolume;

	jQuery.fn.YTPGetVideoData = jQuery.mbYTPlayer.getVideoData;
	jQuery.fn.YTPFullscreen = jQuery.mbYTPlayer.fullscreen;
	jQuery.fn.YTPToggleLoops = jQuery.mbYTPlayer.toggleLoops;
	jQuery.fn.YTPSetVideoQuality = jQuery.mbYTPlayer.setVideoQuality;
	jQuery.fn.YTPManageProgress = jQuery.mbYTPlayer.manageProgress;

	jQuery.fn.YTPApplyFilter = jQuery.mbYTPlayer.applyFilter;
	jQuery.fn.YTPApplyFilters = jQuery.mbYTPlayer.applyFilters;
	jQuery.fn.YTPToggleFilter = jQuery.mbYTPlayer.toggleFilter;
	jQuery.fn.YTPToggleFilters = jQuery.mbYTPlayer.toggleFilters;
	jQuery.fn.YTPRemoveFilter = jQuery.mbYTPlayer.removeFilter;
	jQuery.fn.YTPDisableFilters = jQuery.mbYTPlayer.disableFilters;
	jQuery.fn.YTPEnableFilters = jQuery.mbYTPlayer.enableFilters;
	jQuery.fn.YTPGetFilters = jQuery.mbYTPlayer.getFilters;

	jQuery.fn.YTPGetTime = jQuery.mbYTPlayer.getTime;
	jQuery.fn.YTPGetTotalTime = jQuery.mbYTPlayer.getTotalTime;

	jQuery.fn.YTPAddMask = jQuery.mbYTPlayer.addMask;
	jQuery.fn.YTPRemoveMask = jQuery.mbYTPlayer.removeMask;
	jQuery.fn.YTPToggleMask = jQuery.mbYTPlayer.toggleMask;

	jQuery.fn.YTPSetAlign = jQuery.mbYTPlayer.setAlign;
	jQuery.fn.YTPGetAlign = jQuery.mbYTPlayer.getAlign;


	/**
	 *
	 * @deprecated
	 * todo: Above methods will be removed with version 3.5.0
	 *
	 **/
	jQuery.fn.mb_YTPlayer = jQuery.mbYTPlayer.buildPlayer;
	jQuery.fn.playNext = jQuery.mbYTPlayer.playNext;
	jQuery.fn.playPrev = jQuery.mbYTPlayer.playPrev;
	jQuery.fn.changeMovie = jQuery.mbYTPlayer.changeMovie;
	jQuery.fn.getVideoID = jQuery.mbYTPlayer.getVideoID;
	jQuery.fn.getPlayer = jQuery.mbYTPlayer.getPlayer;
	jQuery.fn.playerDestroy = jQuery.mbYTPlayer.playerDestroy;
	jQuery.fn.fullscreen = jQuery.mbYTPlayer.fullscreen;
	jQuery.fn.buildYTPControls = jQuery.mbYTPlayer.buildControls;
	jQuery.fn.playYTP = jQuery.mbYTPlayer.play;
	jQuery.fn.toggleLoops = jQuery.mbYTPlayer.toggleLoops;
	jQuery.fn.stopYTP = jQuery.mbYTPlayer.stop;
	jQuery.fn.pauseYTP = jQuery.mbYTPlayer.pause;
	jQuery.fn.seekToYTP = jQuery.mbYTPlayer.seekTo;
	jQuery.fn.muteYTPVolume = jQuery.mbYTPlayer.mute;
	jQuery.fn.unmuteYTPVolume = jQuery.mbYTPlayer.unmute;
	jQuery.fn.setYTPVolume = jQuery.mbYTPlayer.setVolume;
	jQuery.fn.setVideoQuality = jQuery.mbYTPlayer.setVideoQuality;
	jQuery.fn.manageYTPProgress = jQuery.mbYTPlayer.manageProgress;
	jQuery.fn.YTPGetDataFromFeed = jQuery.mbYTPlayer.getVideoData;


} )( jQuery, ytp );
;
/*
 * ******************************************************************************
 *  jquery.mb.components
 *  file: jquery.mb.CSSAnimate.min.js
 *
 *  Copyright (c) 2001-2014. Matteo Bicocchi (Pupunzi);
 *  Open lab srl, Firenze - Italy
 *  email: matteo@open-lab.com
 *  site: 	http://pupunzi.com
 *  blog:	http://pupunzi.open-lab.com
 * 	http://open-lab.com
 *
 *  Licences: MIT, GPL
 *  http://www.opensource.org/licenses/mit-license.php
 *  http://www.gnu.org/licenses/gpl.html
 *
 *  last modified: 26/03/14 21.40
 *  *****************************************************************************
 */

function uncamel(e){return e.replace(/([A-Z])/g,function(e){return"-"+e.toLowerCase()})}function setUnit(e,t){return"string"!=typeof e||e.match(/^[\-0-9\.]+jQuery/)?""+e+t:e}function setFilter(e,t,r){var i=uncamel(t),n=jQuery.browser.mozilla?"":jQuery.CSS.sfx;e[n+"filter"]=e[n+"filter"]||"",r=setUnit(r>jQuery.CSS.filters[t].max?jQuery.CSS.filters[t].max:r,jQuery.CSS.filters[t].unit),e[n+"filter"]+=i+"("+r+") ",delete e[t]}jQuery.support.CSStransition=function(){var e=document.body||document.documentElement,t=e.style;return void 0!==t.transition||void 0!==t.WebkitTransition||void 0!==t.MozTransition||void 0!==t.MsTransition||void 0!==t.OTransition}(),jQuery.CSS={name:"mb.CSSAnimate",author:"Matteo Bicocchi",version:"2.0.0",transitionEnd:"transitionEnd",sfx:"",filters:{blur:{min:0,max:100,unit:"px"},brightness:{min:0,max:400,unit:"%"},contrast:{min:0,max:400,unit:"%"},grayscale:{min:0,max:100,unit:"%"},hueRotate:{min:0,max:360,unit:"deg"},invert:{min:0,max:100,unit:"%"},saturate:{min:0,max:400,unit:"%"},sepia:{min:0,max:100,unit:"%"}},normalizeCss:function(e){var t=jQuery.extend(!0,{},e);jQuery.browser.webkit||jQuery.browser.opera?jQuery.CSS.sfx="-webkit-":jQuery.browser.mozilla?jQuery.CSS.sfx="-moz-":jQuery.browser.msie&&(jQuery.CSS.sfx="-ms-");for(var r in t){"transform"===r&&(t[jQuery.CSS.sfx+"transform"]=t[r],delete t[r]),"transform-origin"===r&&(t[jQuery.CSS.sfx+"transform-origin"]=e[r],delete t[r]),"filter"!==r||jQuery.browser.mozilla||(t[jQuery.CSS.sfx+"filter"]=e[r],delete t[r]),"blur"===r&&setFilter(t,"blur",e[r]),"brightness"===r&&setFilter(t,"brightness",e[r]),"contrast"===r&&setFilter(t,"contrast",e[r]),"grayscale"===r&&setFilter(t,"grayscale",e[r]),"hueRotate"===r&&setFilter(t,"hueRotate",e[r]),"invert"===r&&setFilter(t,"invert",e[r]),"saturate"===r&&setFilter(t,"saturate",e[r]),"sepia"===r&&setFilter(t,"sepia",e[r]);var i="";"x"===r&&(i=jQuery.CSS.sfx+"transform",t[i]=t[i]||"",t[i]+=" translateX("+setUnit(e[r],"px")+")",delete t[r]),"y"===r&&(i=jQuery.CSS.sfx+"transform",t[i]=t[i]||"",t[i]+=" translateY("+setUnit(e[r],"px")+")",delete t[r]),"z"===r&&(i=jQuery.CSS.sfx+"transform",t[i]=t[i]||"",t[i]+=" translateZ("+setUnit(e[r],"px")+")",delete t[r]),"rotate"===r&&(i=jQuery.CSS.sfx+"transform",t[i]=t[i]||"",t[i]+=" rotate("+setUnit(e[r],"deg")+")",delete t[r]),"rotateX"===r&&(i=jQuery.CSS.sfx+"transform",t[i]=t[i]||"",t[i]+=" rotateX("+setUnit(e[r],"deg")+")",delete t[r]),"rotateY"===r&&(i=jQuery.CSS.sfx+"transform",t[i]=t[i]||"",t[i]+=" rotateY("+setUnit(e[r],"deg")+")",delete t[r]),"rotateZ"===r&&(i=jQuery.CSS.sfx+"transform",t[i]=t[i]||"",t[i]+=" rotateZ("+setUnit(e[r],"deg")+")",delete t[r]),"scale"===r&&(i=jQuery.CSS.sfx+"transform",t[i]=t[i]||"",t[i]+=" scale("+setUnit(e[r],"")+")",delete t[r]),"scaleX"===r&&(i=jQuery.CSS.sfx+"transform",t[i]=t[i]||"",t[i]+=" scaleX("+setUnit(e[r],"")+")",delete t[r]),"scaleY"===r&&(i=jQuery.CSS.sfx+"transform",t[i]=t[i]||"",t[i]+=" scaleY("+setUnit(e[r],"")+")",delete t[r]),"scaleZ"===r&&(i=jQuery.CSS.sfx+"transform",t[i]=t[i]||"",t[i]+=" scaleZ("+setUnit(e[r],"")+")",delete t[r]),"skew"===r&&(i=jQuery.CSS.sfx+"transform",t[i]=t[i]||"",t[i]+=" skew("+setUnit(e[r],"deg")+")",delete t[r]),"skewX"===r&&(i=jQuery.CSS.sfx+"transform",t[i]=t[i]||"",t[i]+=" skewX("+setUnit(e[r],"deg")+")",delete t[r]),"skewY"===r&&(i=jQuery.CSS.sfx+"transform",t[i]=t[i]||"",t[i]+=" skewY("+setUnit(e[r],"deg")+")",delete t[r]),"perspective"===r&&(i=jQuery.CSS.sfx+"transform",t[i]=t[i]||"",t[i]+=" perspective("+setUnit(e[r],"px")+")",delete t[r])}return t},getProp:function(e){var t=[];for(var r in e)t.indexOf(r)<0&&t.push(uncamel(r));return t.join(",")},animate:function(e,t,r,i,n){return this.each(function(){function s(){u.called=!0,u.CSSAIsRunning=!1,a.off(jQuery.CSS.transitionEnd+"."+u.id),clearTimeout(u.timeout),a.css(jQuery.CSS.sfx+"transition",""),"function"==typeof n&&n.apply(u),"function"==typeof u.CSSqueue&&(u.CSSqueue(),u.CSSqueue=null)}var u=this,a=jQuery(this);u.id=u.id||"CSSA_"+(new Date).getTime();var o=o||{type:"noEvent"};if(u.CSSAIsRunning&&u.eventType==o.type&&!jQuery.browser.msie&&jQuery.browser.version<=9)return void(u.CSSqueue=function(){a.CSSAnimate(e,t,r,i,n)});if(u.CSSqueue=null,u.eventType=o.type,0!==a.length&&e){if(e=jQuery.normalizeCss(e),u.CSSAIsRunning=!0,"function"==typeof t&&(n=t,t=jQuery.fx.speeds._default),"function"==typeof r&&(i=r,r=0),"string"==typeof r&&(n=r,r=0),"function"==typeof i&&(n=i,i="cubic-bezier(0.65,0.03,0.36,0.72)"),"string"==typeof t)for(var f in jQuery.fx.speeds){if(t==f){t=jQuery.fx.speeds[f];break}t=jQuery.fx.speeds._default}if(t||(t=jQuery.fx.speeds._default),"string"==typeof n&&(i=n,n=null),!jQuery.support.CSStransition){for(var c in e){if("transform"===c&&delete e[c],"filter"===c&&delete e[c],"transform-origin"===c&&delete e[c],"auto"===e[c]&&delete e[c],"x"===c){var S=e[c],l="left";e[l]=S,delete e[c]}if("y"===c){var S=e[c],l="top";e[l]=S,delete e[c]}("-ms-transform"===c||"-ms-filter"===c)&&delete e[c]}return void a.delay(r).animate(e,t,n)}var y={"default":"ease","in":"ease-in",out:"ease-out","in-out":"ease-in-out",snap:"cubic-bezier(0,1,.5,1)",easeOutCubic:"cubic-bezier(.215,.61,.355,1)",easeInOutCubic:"cubic-bezier(.645,.045,.355,1)",easeInCirc:"cubic-bezier(.6,.04,.98,.335)",easeOutCirc:"cubic-bezier(.075,.82,.165,1)",easeInOutCirc:"cubic-bezier(.785,.135,.15,.86)",easeInExpo:"cubic-bezier(.95,.05,.795,.035)",easeOutExpo:"cubic-bezier(.19,1,.22,1)",easeInOutExpo:"cubic-bezier(1,0,0,1)",easeInQuad:"cubic-bezier(.55,.085,.68,.53)",easeOutQuad:"cubic-bezier(.25,.46,.45,.94)",easeInOutQuad:"cubic-bezier(.455,.03,.515,.955)",easeInQuart:"cubic-bezier(.895,.03,.685,.22)",easeOutQuart:"cubic-bezier(.165,.84,.44,1)",easeInOutQuart:"cubic-bezier(.77,0,.175,1)",easeInQuint:"cubic-bezier(.755,.05,.855,.06)",easeOutQuint:"cubic-bezier(.23,1,.32,1)",easeInOutQuint:"cubic-bezier(.86,0,.07,1)",easeInSine:"cubic-bezier(.47,0,.745,.715)",easeOutSine:"cubic-bezier(.39,.575,.565,1)",easeInOutSine:"cubic-bezier(.445,.05,.55,.95)",easeInBack:"cubic-bezier(.6,-.28,.735,.045)",easeOutBack:"cubic-bezier(.175, .885,.32,1.275)",easeInOutBack:"cubic-bezier(.68,-.55,.265,1.55)"};y[i]&&(i=y[i]),a.off(jQuery.CSS.transitionEnd+"."+u.id);var m=jQuery.CSS.getProp(e),d={};jQuery.extend(d,e),d[jQuery.CSS.sfx+"transition-property"]=m,d[jQuery.CSS.sfx+"transition-duration"]=t+"ms",d[jQuery.CSS.sfx+"transition-delay"]=r+"ms",d[jQuery.CSS.sfx+"transition-timing-function"]=i,setTimeout(function(){a.one(jQuery.CSS.transitionEnd+"."+u.id,s),a.css(d)},1),u.timeout=setTimeout(function(){return u.called||!n?(u.called=!1,void(u.CSSAIsRunning=!1)):(a.css(jQuery.CSS.sfx+"transition",""),n.apply(u),u.CSSAIsRunning=!1,void("function"==typeof u.CSSqueue&&(u.CSSqueue(),u.CSSqueue=null)))},t+r+10)}})}},jQuery.fn.CSSAnimate=jQuery.CSS.animate,jQuery.normalizeCss=jQuery.CSS.normalizeCss,jQuery.fn.css3=function(e){return this.each(function(){var t=jQuery(this),r=jQuery.normalizeCss(e);t.css(r)})};
;/*
 * ******************************************************************************
 *  jquery.mb.components
 *  file: jquery.mb.browser.min.js
 *
 *  Copyright (c) 2001-2014. Matteo Bicocchi (Pupunzi);
 *  Open lab srl, Firenze - Italy
 *  email: matteo@open-lab.com
 *  site: 	http://pupunzi.com
 *  blog:	http://pupunzi.open-lab.com
 * 	http://open-lab.com
 *
 *  Licences: MIT, GPL
 *  http://www.opensource.org/licenses/mit-license.php
 *  http://www.gnu.org/licenses/gpl.html
 *
 *  last modified: 26/03/14 21.43
 *  *****************************************************************************
 */

var nAgt=navigator.userAgent;if(!jQuery.browser){jQuery.browser={},jQuery.browser.mozilla=!1,jQuery.browser.webkit=!1,jQuery.browser.opera=!1,jQuery.browser.safari=!1,jQuery.browser.chrome=!1,jQuery.browser.androidStock=!1,jQuery.browser.msie=!1,jQuery.browser.ua=nAgt,jQuery.browser.name=navigator.appName,jQuery.browser.fullVersion=""+parseFloat(navigator.appVersion),jQuery.browser.majorVersion=parseInt(navigator.appVersion,10);var nameOffset,verOffset,ix;if(-1!=(verOffset=nAgt.indexOf("Opera")))jQuery.browser.opera=!0,jQuery.browser.name="Opera",jQuery.browser.fullVersion=nAgt.substring(verOffset+6),-1!=(verOffset=nAgt.indexOf("Version"))&&(jQuery.browser.fullVersion=nAgt.substring(verOffset+8));else if(-1!=(verOffset=nAgt.indexOf("OPR")))jQuery.browser.opera=!0,jQuery.browser.name="Opera",jQuery.browser.fullVersion=nAgt.substring(verOffset+4);else if(-1!=(verOffset=nAgt.indexOf("MSIE")))jQuery.browser.msie=!0,jQuery.browser.name="Microsoft Internet Explorer",jQuery.browser.fullVersion=nAgt.substring(verOffset+5);else if(-1!=nAgt.indexOf("Trident")||-1!=nAgt.indexOf("Edge")){jQuery.browser.msie=!0,jQuery.browser.name="Microsoft Internet Explorer";var start=nAgt.indexOf("rv:")+3,end=start+4;jQuery.browser.fullVersion=nAgt.substring(start,end)}else-1!=(verOffset=nAgt.indexOf("Chrome"))?(jQuery.browser.webkit=!0,jQuery.browser.chrome=!0,jQuery.browser.name="Chrome",jQuery.browser.fullVersion=nAgt.substring(verOffset+7)):nAgt.indexOf("mozilla/5.0")>-1&&nAgt.indexOf("android ")>-1&&nAgt.indexOf("applewebkit")>-1&&!(nAgt.indexOf("chrome")>-1)?(verOffset=nAgt.indexOf("Chrome"),jQuery.browser.webkit=!0,jQuery.browser.androidStock=!0,jQuery.browser.name="androidStock",jQuery.browser.fullVersion=nAgt.substring(verOffset+7)):-1!=(verOffset=nAgt.indexOf("Safari"))?(jQuery.browser.webkit=!0,jQuery.browser.safari=!0,jQuery.browser.name="Safari",jQuery.browser.fullVersion=nAgt.substring(verOffset+7),-1!=(verOffset=nAgt.indexOf("Version"))&&(jQuery.browser.fullVersion=nAgt.substring(verOffset+8))):-1!=(verOffset=nAgt.indexOf("AppleWebkit"))?(jQuery.browser.webkit=!0,jQuery.browser.safari=!0,jQuery.browser.name="Safari",jQuery.browser.fullVersion=nAgt.substring(verOffset+7),-1!=(verOffset=nAgt.indexOf("Version"))&&(jQuery.browser.fullVersion=nAgt.substring(verOffset+8))):-1!=(verOffset=nAgt.indexOf("Firefox"))?(jQuery.browser.mozilla=!0,jQuery.browser.name="Firefox",jQuery.browser.fullVersion=nAgt.substring(verOffset+8)):(nameOffset=nAgt.lastIndexOf(" ")+1)<(verOffset=nAgt.lastIndexOf("/"))&&(jQuery.browser.name=nAgt.substring(nameOffset,verOffset),jQuery.browser.fullVersion=nAgt.substring(verOffset+1),jQuery.browser.name.toLowerCase()==jQuery.browser.name.toUpperCase()&&(jQuery.browser.name=navigator.appName));-1!=(ix=jQuery.browser.fullVersion.indexOf(";"))&&(jQuery.browser.fullVersion=jQuery.browser.fullVersion.substring(0,ix)),-1!=(ix=jQuery.browser.fullVersion.indexOf(" "))&&(jQuery.browser.fullVersion=jQuery.browser.fullVersion.substring(0,ix)),jQuery.browser.majorVersion=parseInt(""+jQuery.browser.fullVersion,10),isNaN(jQuery.browser.majorVersion)&&(jQuery.browser.fullVersion=""+parseFloat(navigator.appVersion),jQuery.browser.majorVersion=parseInt(navigator.appVersion,10)),jQuery.browser.version=jQuery.browser.majorVersion}jQuery.browser.android=/Android/i.test(nAgt),jQuery.browser.blackberry=/BlackBerry|BB|PlayBook/i.test(nAgt),jQuery.browser.ios=/iPhone|iPad|iPod|webOS/i.test(nAgt),jQuery.browser.operaMobile=/Opera Mini/i.test(nAgt),jQuery.browser.windowsMobile=/IEMobile|Windows Phone/i.test(nAgt),jQuery.browser.kindle=/Kindle|Silk/i.test(nAgt),jQuery.browser.mobile=jQuery.browser.android||jQuery.browser.blackberry||jQuery.browser.ios||jQuery.browser.windowsMobile||jQuery.browser.operaMobile||jQuery.browser.kindle,jQuery.isMobile=jQuery.browser.mobile,jQuery.isTablet=jQuery.browser.mobile&&jQuery(window).width()>765,jQuery.isAndroidDefault=jQuery.browser.android&&!/chrome/i.test(nAgt);
;/*___________________________________________________________________________________________________________________________________________________
 _ jquery.mb.components                                                                                                                             _
 _                                                                                                                                                  _
 _ file: jquery.mb.simpleSlider.min.js                                                                                                              _
 _ last modified: 16/05/15 23.45                                                                                                                    _
 _                                                                                                                                                  _
 _ Open Lab s.r.l., Florence - Italy                                                                                                                _
 _                                                                                                                                                  _
 _ email: matteo@open-lab.com                                                                                                                       _
 _ site: http://pupunzi.com                                                                                                                         _
 _       http://open-lab.com                                                                                                                        _
 _ blog: http://pupunzi.open-lab.com                                                                                                                _
 _ Q&A:  http://jquery.pupunzi.com                                                                                                                  _
 _                                                                                                                                                  _
 _ Licences: MIT, GPL                                                                                                                               _
 _    http://www.opensource.org/licenses/mit-license.php                                                                                            _
 _    http://www.gnu.org/licenses/gpl.html                                                                                                          _
 _                                                                                                                                                  _
 _ Copyright (c) 2001-2015. Matteo Bicocchi (Pupunzi);                                                                                              _
 ___________________________________________________________________________________________________________________________________________________*/

!function(e){var t=(/iphone|ipod|ipad|android|ie|blackberry|fennec/.test(navigator.userAgent.toLowerCase()),"ontouchstart"in window||window.navigator&&window.navigator.msPointerEnabled&&window.MSGesture||window.DocumentTouch&&document instanceof DocumentTouch||!1);e.simpleSlider={defaults:{initialval:0,scale:100,orientation:"h",readonly:!1,callback:!1},events:{start:t?"touchstart":"mousedown",end:t?"touchend":"mouseup",move:t?"touchmove":"mousemove"},init:function(o){return this.each(function(){var a=this,l=e(a);l.addClass("simpleSlider"),a.opt={},e.extend(a.opt,e.simpleSlider.defaults,o),e.extend(a.opt,l.data());var i="h"==a.opt.orientation?"horizontal":"vertical",n=e("<div/>").addClass("level").addClass(i);l.prepend(n),a.level=n,l.css({cursor:"default"}),"auto"==a.opt.scale&&(a.opt.scale=e(a).outerWidth()),l.updateSliderVal(),a.opt.readonly||(l.on(e.simpleSlider.events.start,function(e){t&&(e=e.changedTouches[0]),a.canSlide=!0,l.updateSliderVal(e),l.css({cursor:"col-resize"}),e.preventDefault(),e.stopPropagation()}),e(document).on(e.simpleSlider.events.move,function(o){t&&(o=o.changedTouches[0]),a.canSlide&&(e(document).css({cursor:"default"}),l.updateSliderVal(o),o.preventDefault(),o.stopPropagation())}).on(e.simpleSlider.events.end,function(){e(document).css({cursor:"auto"}),a.canSlide=!1,l.css({cursor:"auto"})}))})},updateSliderVal:function(t){function o(e,t){return Math.floor(100*e/t)}var a=this,l=a.get(0);if(l.opt){l.opt.initialval="number"==typeof l.opt.initialval?l.opt.initialval:l.opt.initialval(l);var i=e(l).outerWidth(),n=e(l).outerHeight();l.x="object"==typeof t?t.clientX+document.body.scrollLeft-a.offset().left:"number"==typeof t?t*i/l.opt.scale:l.opt.initialval*i/l.opt.scale,l.y="object"==typeof t?t.clientY+document.body.scrollTop-a.offset().top:"number"==typeof t?(l.opt.scale-l.opt.initialval-t)*n/l.opt.scale:l.opt.initialval*n/l.opt.scale,l.y=a.outerHeight()-l.y,l.scaleX=l.x*l.opt.scale/i,l.scaleY=l.y*l.opt.scale/n,l.outOfRangeX=l.scaleX>l.opt.scale?l.scaleX-l.opt.scale:l.scaleX<0?l.scaleX:0,l.outOfRangeY=l.scaleY>l.opt.scale?l.scaleY-l.opt.scale:l.scaleY<0?l.scaleY:0,l.outOfRange="h"==l.opt.orientation?l.outOfRangeX:l.outOfRangeY,"undefined"!=typeof t?l.value="h"==l.opt.orientation?l.x>=a.outerWidth()?l.opt.scale:l.x<=0?0:l.scaleX:l.y>=a.outerHeight()?l.opt.scale:l.y<=0?0:l.scaleY:l.value="h"==l.opt.orientation?l.scaleX:l.scaleY,"h"==l.opt.orientation?l.level.width(o(l.x,i)+"%"):l.level.height(o(l.y,n)),"function"==typeof l.opt.callback&&l.opt.callback(l)}}},e.fn.simpleSlider=e.simpleSlider.init,e.fn.updateSliderVal=e.simpleSlider.updateSliderVal}(jQuery);
;/*___________________________________________________________________________________________________________________________________________________
 _ jquery.mb.components                                                                                                                             _
 _                                                                                                                                                  _
 _ file: jquery.mb.storage.min.js                                                                                                                   _
 _ last modified: 24/05/15 16.08                                                                                                                    _
 _                                                                                                                                                  _
 _ Open Lab s.r.l., Florence - Italy                                                                                                                _
 _                                                                                                                                                  _
 _ email: matteo@open-lab.com                                                                                                                       _
 _ site: http://pupunzi.com                                                                                                                         _
 _       http://open-lab.com                                                                                                                        _
 _ blog: http://pupunzi.open-lab.com                                                                                                                _
 _ Q&A:  http://jquery.pupunzi.com                                                                                                                  _
 _                                                                                                                                                  _
 _ Licences: MIT, GPL                                                                                                                               _
 _    http://www.opensource.org/licenses/mit-license.php                                                                                            _
 _    http://www.gnu.org/licenses/gpl.html                                                                                                          _
 _                                                                                                                                                  _
 _ Copyright (c) 2001-2015. Matteo Bicocchi (Pupunzi);                                                                                              _
 ___________________________________________________________________________________________________________________________________________________*/

!function(a){a.mbCookie={set:function(a,b,c,d){b=JSON.stringify(b),c||(c=7),d=d?"; domain="+d:"";var f,e=new Date;e.setTime(e.getTime()+1e3*60*60*24*c),f="; expires="+e.toGMTString(),document.cookie=a+"="+b+f+"; path=/"+d},get:function(a){for(var b=a+"=",c=document.cookie.split(";"),d=0;d<c.length;d++){for(var e=c[d];" "==e.charAt(0);)e=e.substring(1,e.length);if(0==e.indexOf(b))return JSON.parse(e.substring(b.length,e.length))}return null},remove:function(b){a.mbCookie.set(b,"",-1)}},a.mbStorage={set:function(a,b){b=JSON.stringify(b),localStorage.setItem(a,b)},get:function(a){return localStorage[a]?JSON.parse(localStorage[a]):null},remove:function(a){a?localStorage.removeItem(a):localStorage.clear()}}}(jQuery);
/*!
 * imagesLoaded PACKAGED v3.1.6
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */


(function(){function e(){}function t(e,t){for(var n=e.length;n--;)if(e[n].listener===t)return n;return-1}function n(e){return function(){return this[e].apply(this,arguments)}}var i=e.prototype,r=this,o=r.EventEmitter;i.getListeners=function(e){var t,n,i=this._getEvents();if("object"==typeof e){t={};for(n in i)i.hasOwnProperty(n)&&e.test(n)&&(t[n]=i[n])}else t=i[e]||(i[e]=[]);return t},i.flattenListeners=function(e){var t,n=[];for(t=0;e.length>t;t+=1)n.push(e[t].listener);return n},i.getListenersAsObject=function(e){var t,n=this.getListeners(e);return n instanceof Array&&(t={},t[e]=n),t||n},i.addListener=function(e,n){var i,r=this.getListenersAsObject(e),o="object"==typeof n;for(i in r)r.hasOwnProperty(i)&&-1===t(r[i],n)&&r[i].push(o?n:{listener:n,once:!1});return this},i.on=n("addListener"),i.addOnceListener=function(e,t){return this.addListener(e,{listener:t,once:!0})},i.once=n("addOnceListener"),i.defineEvent=function(e){return this.getListeners(e),this},i.defineEvents=function(e){for(var t=0;e.length>t;t+=1)this.defineEvent(e[t]);return this},i.removeListener=function(e,n){var i,r,o=this.getListenersAsObject(e);for(r in o)o.hasOwnProperty(r)&&(i=t(o[r],n),-1!==i&&o[r].splice(i,1));return this},i.off=n("removeListener"),i.addListeners=function(e,t){return this.manipulateListeners(!1,e,t)},i.removeListeners=function(e,t){return this.manipulateListeners(!0,e,t)},i.manipulateListeners=function(e,t,n){var i,r,o=e?this.removeListener:this.addListener,s=e?this.removeListeners:this.addListeners;if("object"!=typeof t||t instanceof RegExp)for(i=n.length;i--;)o.call(this,t,n[i]);else for(i in t)t.hasOwnProperty(i)&&(r=t[i])&&("function"==typeof r?o.call(this,i,r):s.call(this,i,r));return this},i.removeEvent=function(e){var t,n=typeof e,i=this._getEvents();if("string"===n)delete i[e];else if("object"===n)for(t in i)i.hasOwnProperty(t)&&e.test(t)&&delete i[t];else delete this._events;return this},i.removeAllListeners=n("removeEvent"),i.emitEvent=function(e,t){var n,i,r,o,s=this.getListenersAsObject(e);for(r in s)if(s.hasOwnProperty(r))for(i=s[r].length;i--;)n=s[r][i],n.once===!0&&this.removeListener(e,n.listener),o=n.listener.apply(this,t||[]),o===this._getOnceReturnValue()&&this.removeListener(e,n.listener);return this},i.trigger=n("emitEvent"),i.emit=function(e){var t=Array.prototype.slice.call(arguments,1);return this.emitEvent(e,t)},i.setOnceReturnValue=function(e){return this._onceReturnValue=e,this},i._getOnceReturnValue=function(){return this.hasOwnProperty("_onceReturnValue")?this._onceReturnValue:!0},i._getEvents=function(){return this._events||(this._events={})},e.noConflict=function(){return r.EventEmitter=o,e},"function"==typeof define&&define.amd?define("eventEmitter/EventEmitter",[],function(){return e}):"object"==typeof module&&module.exports?module.exports=e:this.EventEmitter=e}).call(this),function(e){function t(t){var n=e.event;return n.target=n.target||n.srcElement||t,n}var n=document.documentElement,i=function(){};n.addEventListener?i=function(e,t,n){e.addEventListener(t,n,!1)}:n.attachEvent&&(i=function(e,n,i){e[n+i]=i.handleEvent?function(){var n=t(e);i.handleEvent.call(i,n)}:function(){var n=t(e);i.call(e,n)},e.attachEvent("on"+n,e[n+i])});var r=function(){};n.removeEventListener?r=function(e,t,n){e.removeEventListener(t,n,!1)}:n.detachEvent&&(r=function(e,t,n){e.detachEvent("on"+t,e[t+n]);try{delete e[t+n]}catch(i){e[t+n]=void 0}});var o={bind:i,unbind:r};"function"==typeof define&&define.amd?define("eventie/eventie",o):e.eventie=o}(this),function(e,t){"function"==typeof define&&define.amd?define(["eventEmitter/EventEmitter","eventie/eventie"],function(n,i){return t(e,n,i)}):"object"==typeof exports?module.exports=t(e,require("eventEmitter"),require("eventie")):e.imagesLoaded=t(e,e.EventEmitter,e.eventie)}(this,function(e,t,n){function i(e,t){for(var n in t)e[n]=t[n];return e}function r(e){return"[object Array]"===d.call(e)}function o(e){var t=[];if(r(e))t=e;else if("number"==typeof e.length)for(var n=0,i=e.length;i>n;n++)t.push(e[n]);else t.push(e);return t}function s(e,t,n){if(!(this instanceof s))return new s(e,t);"string"==typeof e&&(e=document.querySelectorAll(e)),this.elements=o(e),this.options=i({},this.options),"function"==typeof t?n=t:i(this.options,t),n&&this.on("always",n),this.getImages(),a&&(this.jqDeferred=new a.Deferred);var r=this;setTimeout(function(){r.check()})}function c(e){this.img=e}function f(e){this.src=e,v[e]=this}var a=e.jQuery,u=e.console,h=u!==void 0,d=Object.prototype.toString;s.prototype=new t,s.prototype.options={},s.prototype.getImages=function(){this.images=[];for(var e=0,t=this.elements.length;t>e;e++){var n=this.elements[e];"IMG"===n.nodeName&&this.addImage(n);var i=n.nodeType;if(i&&(1===i||9===i||11===i))for(var r=n.querySelectorAll("img"),o=0,s=r.length;s>o;o++){var c=r[o];this.addImage(c)}}},s.prototype.addImage=function(e){var t=new c(e);this.images.push(t)},s.prototype.check=function(){function e(e,r){return t.options.debug&&h&&u.log("confirm",e,r),t.progress(e),n++,n===i&&t.complete(),!0}var t=this,n=0,i=this.images.length;if(this.hasAnyBroken=!1,!i)return this.complete(),void 0;for(var r=0;i>r;r++){var o=this.images[r];o.on("confirm",e),o.check()}},s.prototype.progress=function(e){this.hasAnyBroken=this.hasAnyBroken||!e.isLoaded;var t=this;setTimeout(function(){t.emit("progress",t,e),t.jqDeferred&&t.jqDeferred.notify&&t.jqDeferred.notify(t,e)})},s.prototype.complete=function(){var e=this.hasAnyBroken?"fail":"done";this.isComplete=!0;var t=this;setTimeout(function(){if(t.emit(e,t),t.emit("always",t),t.jqDeferred){var n=t.hasAnyBroken?"reject":"resolve";t.jqDeferred[n](t)}})},a&&(a.fn.imagesLoaded=function(e,t){var n=new s(this,e,t);return n.jqDeferred.promise(a(this))}),c.prototype=new t,c.prototype.check=function(){var e=v[this.img.src]||new f(this.img.src);if(e.isConfirmed)return this.confirm(e.isLoaded,"cached was confirmed"),void 0;if(this.img.complete&&void 0!==this.img.naturalWidth)return this.confirm(0!==this.img.naturalWidth,"naturalWidth"),void 0;var t=this;e.on("confirm",function(e,n){return t.confirm(e.isLoaded,n),!0}),e.check()},c.prototype.confirm=function(e,t){this.isLoaded=e,this.emit("confirm",this,t)};var v={};return f.prototype=new t,f.prototype.check=function(){if(!this.isChecked){var e=new Image;n.bind(e,"load",this),n.bind(e,"error",this),e.src=this.src,this.isChecked=!0}},f.prototype.handleEvent=function(e){var t="on"+e.type;this[t]&&this[t](e)},f.prototype.onload=function(e){this.confirm(!0,"onload"),this.unbindProxyEvents(e)},f.prototype.onerror=function(e){this.confirm(!1,"onerror"),this.unbindProxyEvents(e)},f.prototype.confirm=function(e,t){this.isConfirmed=!0,this.isLoaded=e,this.emit("confirm",this,t)},f.prototype.unbindProxyEvents=function(e){n.unbind(e.target,"load",this),n.unbind(e.target,"error",this)},s});
/*!
 * Isotope PACKAGED v2.0.0
 * Filter & sort magical layouts
 * http://isotope.metafizzy.co
 */


(function(t){function e(){}function i(t){function i(e){e.prototype.option||(e.prototype.option=function(e){t.isPlainObject(e)&&(this.options=t.extend(!0,this.options,e))})}function n(e,i){t.fn[e]=function(n){if("string"==typeof n){for(var s=o.call(arguments,1),a=0,u=this.length;u>a;a++){var p=this[a],h=t.data(p,e);if(h)if(t.isFunction(h[n])&&"_"!==n.charAt(0)){var f=h[n].apply(h,s);if(void 0!==f)return f}else r("no such method '"+n+"' for "+e+" instance");else r("cannot call methods on "+e+" prior to initialization; "+"attempted to call '"+n+"'")}return this}return this.each(function(){var o=t.data(this,e);o?(o.option(n),o._init()):(o=new i(this,n),t.data(this,e,o))})}}if(t){var r="undefined"==typeof console?e:function(t){console.error(t)};return t.bridget=function(t,e){i(e),n(t,e)},t.bridget}}var o=Array.prototype.slice;"function"==typeof define&&define.amd?define("jquery-bridget/jquery.bridget",["jquery"],i):i(t.jQuery)})(window),function(t){function e(e){var i=t.event;return i.target=i.target||i.srcElement||e,i}var i=document.documentElement,o=function(){};i.addEventListener?o=function(t,e,i){t.addEventListener(e,i,!1)}:i.attachEvent&&(o=function(t,i,o){t[i+o]=o.handleEvent?function(){var i=e(t);o.handleEvent.call(o,i)}:function(){var i=e(t);o.call(t,i)},t.attachEvent("on"+i,t[i+o])});var n=function(){};i.removeEventListener?n=function(t,e,i){t.removeEventListener(e,i,!1)}:i.detachEvent&&(n=function(t,e,i){t.detachEvent("on"+e,t[e+i]);try{delete t[e+i]}catch(o){t[e+i]=void 0}});var r={bind:o,unbind:n};"function"==typeof define&&define.amd?define("eventie/eventie",r):"object"==typeof exports?module.exports=r:t.eventie=r}(this),function(t){function e(t){"function"==typeof t&&(e.isReady?t():r.push(t))}function i(t){var i="readystatechange"===t.type&&"complete"!==n.readyState;if(!e.isReady&&!i){e.isReady=!0;for(var o=0,s=r.length;s>o;o++){var a=r[o];a()}}}function o(o){return o.bind(n,"DOMContentLoaded",i),o.bind(n,"readystatechange",i),o.bind(t,"load",i),e}var n=t.document,r=[];e.isReady=!1,"function"==typeof define&&define.amd?(e.isReady="function"==typeof requirejs,define("doc-ready/doc-ready",["eventie/eventie"],o)):t.docReady=o(t.eventie)}(this),function(){function t(){}function e(t,e){for(var i=t.length;i--;)if(t[i].listener===e)return i;return-1}function i(t){return function(){return this[t].apply(this,arguments)}}var o=t.prototype,n=this,r=n.EventEmitter;o.getListeners=function(t){var e,i,o=this._getEvents();if(t instanceof RegExp){e={};for(i in o)o.hasOwnProperty(i)&&t.test(i)&&(e[i]=o[i])}else e=o[t]||(o[t]=[]);return e},o.flattenListeners=function(t){var e,i=[];for(e=0;t.length>e;e+=1)i.push(t[e].listener);return i},o.getListenersAsObject=function(t){var e,i=this.getListeners(t);return i instanceof Array&&(e={},e[t]=i),e||i},o.addListener=function(t,i){var o,n=this.getListenersAsObject(t),r="object"==typeof i;for(o in n)n.hasOwnProperty(o)&&-1===e(n[o],i)&&n[o].push(r?i:{listener:i,once:!1});return this},o.on=i("addListener"),o.addOnceListener=function(t,e){return this.addListener(t,{listener:e,once:!0})},o.once=i("addOnceListener"),o.defineEvent=function(t){return this.getListeners(t),this},o.defineEvents=function(t){for(var e=0;t.length>e;e+=1)this.defineEvent(t[e]);return this},o.removeListener=function(t,i){var o,n,r=this.getListenersAsObject(t);for(n in r)r.hasOwnProperty(n)&&(o=e(r[n],i),-1!==o&&r[n].splice(o,1));return this},o.off=i("removeListener"),o.addListeners=function(t,e){return this.manipulateListeners(!1,t,e)},o.removeListeners=function(t,e){return this.manipulateListeners(!0,t,e)},o.manipulateListeners=function(t,e,i){var o,n,r=t?this.removeListener:this.addListener,s=t?this.removeListeners:this.addListeners;if("object"!=typeof e||e instanceof RegExp)for(o=i.length;o--;)r.call(this,e,i[o]);else for(o in e)e.hasOwnProperty(o)&&(n=e[o])&&("function"==typeof n?r.call(this,o,n):s.call(this,o,n));return this},o.removeEvent=function(t){var e,i=typeof t,o=this._getEvents();if("string"===i)delete o[t];else if(t instanceof RegExp)for(e in o)o.hasOwnProperty(e)&&t.test(e)&&delete o[e];else delete this._events;return this},o.removeAllListeners=i("removeEvent"),o.emitEvent=function(t,e){var i,o,n,r,s=this.getListenersAsObject(t);for(n in s)if(s.hasOwnProperty(n))for(o=s[n].length;o--;)i=s[n][o],i.once===!0&&this.removeListener(t,i.listener),r=i.listener.apply(this,e||[]),r===this._getOnceReturnValue()&&this.removeListener(t,i.listener);return this},o.trigger=i("emitEvent"),o.emit=function(t){var e=Array.prototype.slice.call(arguments,1);return this.emitEvent(t,e)},o.setOnceReturnValue=function(t){return this._onceReturnValue=t,this},o._getOnceReturnValue=function(){return this.hasOwnProperty("_onceReturnValue")?this._onceReturnValue:!0},o._getEvents=function(){return this._events||(this._events={})},t.noConflict=function(){return n.EventEmitter=r,t},"function"==typeof define&&define.amd?define("eventEmitter/EventEmitter",[],function(){return t}):"object"==typeof module&&module.exports?module.exports=t:this.EventEmitter=t}.call(this),function(t){function e(t){if(t){if("string"==typeof o[t])return t;t=t.charAt(0).toUpperCase()+t.slice(1);for(var e,n=0,r=i.length;r>n;n++)if(e=i[n]+t,"string"==typeof o[e])return e}}var i="Webkit Moz ms Ms O".split(" "),o=document.documentElement.style;"function"==typeof define&&define.amd?define("get-style-property/get-style-property",[],function(){return e}):"object"==typeof exports?module.exports=e:t.getStyleProperty=e}(window),function(t){function e(t){var e=parseFloat(t),i=-1===t.indexOf("%")&&!isNaN(e);return i&&e}function i(){for(var t={width:0,height:0,innerWidth:0,innerHeight:0,outerWidth:0,outerHeight:0},e=0,i=s.length;i>e;e++){var o=s[e];t[o]=0}return t}function o(t){function o(t){if("string"==typeof t&&(t=document.querySelector(t)),t&&"object"==typeof t&&t.nodeType){var o=r(t);if("none"===o.display)return i();var n={};n.width=t.offsetWidth,n.height=t.offsetHeight;for(var h=n.isBorderBox=!(!p||!o[p]||"border-box"!==o[p]),f=0,c=s.length;c>f;f++){var d=s[f],l=o[d];l=a(t,l);var y=parseFloat(l);n[d]=isNaN(y)?0:y}var m=n.paddingLeft+n.paddingRight,g=n.paddingTop+n.paddingBottom,v=n.marginLeft+n.marginRight,_=n.marginTop+n.marginBottom,I=n.borderLeftWidth+n.borderRightWidth,L=n.borderTopWidth+n.borderBottomWidth,z=h&&u,S=e(o.width);S!==!1&&(n.width=S+(z?0:m+I));var b=e(o.height);return b!==!1&&(n.height=b+(z?0:g+L)),n.innerWidth=n.width-(m+I),n.innerHeight=n.height-(g+L),n.outerWidth=n.width+v,n.outerHeight=n.height+_,n}}function a(t,e){if(n||-1===e.indexOf("%"))return e;var i=t.style,o=i.left,r=t.runtimeStyle,s=r&&r.left;return s&&(r.left=t.currentStyle.left),i.left=e,e=i.pixelLeft,i.left=o,s&&(r.left=s),e}var u,p=t("boxSizing");return function(){if(p){var t=document.createElement("div");t.style.width="200px",t.style.padding="1px 2px 3px 4px",t.style.borderStyle="solid",t.style.borderWidth="1px 2px 3px 4px",t.style[p]="border-box";var i=document.body||document.documentElement;i.appendChild(t);var o=r(t);u=200===e(o.width),i.removeChild(t)}}(),o}var n=t.getComputedStyle,r=n?function(t){return n(t,null)}:function(t){return t.currentStyle},s=["paddingLeft","paddingRight","paddingTop","paddingBottom","marginLeft","marginRight","marginTop","marginBottom","borderLeftWidth","borderRightWidth","borderTopWidth","borderBottomWidth"];"function"==typeof define&&define.amd?define("get-size/get-size",["get-style-property/get-style-property"],o):"object"==typeof exports?module.exports=o(require("get-style-property")):t.getSize=o(t.getStyleProperty)}(window),function(t,e){function i(t,e){return t[a](e)}function o(t){if(!t.parentNode){var e=document.createDocumentFragment();e.appendChild(t)}}function n(t,e){o(t);for(var i=t.parentNode.querySelectorAll(e),n=0,r=i.length;r>n;n++)if(i[n]===t)return!0;return!1}function r(t,e){return o(t),i(t,e)}var s,a=function(){if(e.matchesSelector)return"matchesSelector";for(var t=["webkit","moz","ms","o"],i=0,o=t.length;o>i;i++){var n=t[i],r=n+"MatchesSelector";if(e[r])return r}}();if(a){var u=document.createElement("div"),p=i(u,"div");s=p?i:r}else s=n;"function"==typeof define&&define.amd?define("matches-selector/matches-selector",[],function(){return s}):window.matchesSelector=s}(this,Element.prototype),function(t){function e(t,e){for(var i in e)t[i]=e[i];return t}function i(t){for(var e in t)return!1;return e=null,!0}function o(t){return t.replace(/([A-Z])/g,function(t){return"-"+t.toLowerCase()})}function n(t,n,r){function a(t,e){t&&(this.element=t,this.layout=e,this.position={x:0,y:0},this._create())}var u=r("transition"),p=r("transform"),h=u&&p,f=!!r("perspective"),c={WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"otransitionend",transition:"transitionend"}[u],d=["transform","transition","transitionDuration","transitionProperty"],l=function(){for(var t={},e=0,i=d.length;i>e;e++){var o=d[e],n=r(o);n&&n!==o&&(t[o]=n)}return t}();e(a.prototype,t.prototype),a.prototype._create=function(){this._transn={ingProperties:{},clean:{},onEnd:{}},this.css({position:"absolute"})},a.prototype.handleEvent=function(t){var e="on"+t.type;this[e]&&this[e](t)},a.prototype.getSize=function(){this.size=n(this.element)},a.prototype.css=function(t){var e=this.element.style;for(var i in t){var o=l[i]||i;e[o]=t[i]}},a.prototype.getPosition=function(){var t=s(this.element),e=this.layout.options,i=e.isOriginLeft,o=e.isOriginTop,n=parseInt(t[i?"left":"right"],10),r=parseInt(t[o?"top":"bottom"],10);n=isNaN(n)?0:n,r=isNaN(r)?0:r;var a=this.layout.size;n-=i?a.paddingLeft:a.paddingRight,r-=o?a.paddingTop:a.paddingBottom,this.position.x=n,this.position.y=r},a.prototype.layoutPosition=function(){var t=this.layout.size,e=this.layout.options,i={};e.isOriginLeft?(i.left=this.position.x+t.paddingLeft+"px",i.right=""):(i.right=this.position.x+t.paddingRight+"px",i.left=""),e.isOriginTop?(i.top=this.position.y+t.paddingTop+"px",i.bottom=""):(i.bottom=this.position.y+t.paddingBottom+"px",i.top=""),this.css(i),this.emitEvent("layout",[this])};var y=f?function(t,e){return"translate3d("+t+"px, "+e+"px, 0)"}:function(t,e){return"translate("+t+"px, "+e+"px)"};a.prototype._transitionTo=function(t,e){this.getPosition();var i=this.position.x,o=this.position.y,n=parseInt(t,10),r=parseInt(e,10),s=n===this.position.x&&r===this.position.y;if(this.setPosition(t,e),s&&!this.isTransitioning)return this.layoutPosition(),void 0;var a=t-i,u=e-o,p={},h=this.layout.options;a=h.isOriginLeft?a:-a,u=h.isOriginTop?u:-u,p.transform=y(a,u),this.transition({to:p,onTransitionEnd:{transform:this.layoutPosition},isCleaning:!0})},a.prototype.goTo=function(t,e){this.setPosition(t,e),this.layoutPosition()},a.prototype.moveTo=h?a.prototype._transitionTo:a.prototype.goTo,a.prototype.setPosition=function(t,e){this.position.x=parseInt(t,10),this.position.y=parseInt(e,10)},a.prototype._nonTransition=function(t){this.css(t.to),t.isCleaning&&this._removeStyles(t.to);for(var e in t.onTransitionEnd)t.onTransitionEnd[e].call(this)},a.prototype._transition=function(t){if(!parseFloat(this.layout.options.transitionDuration))return this._nonTransition(t),void 0;var e=this._transn;for(var i in t.onTransitionEnd)e.onEnd[i]=t.onTransitionEnd[i];for(i in t.to)e.ingProperties[i]=!0,t.isCleaning&&(e.clean[i]=!0);if(t.from){this.css(t.from);var o=this.element.offsetHeight;o=null}this.enableTransition(t.to),this.css(t.to),this.isTransitioning=!0};var m=p&&o(p)+",opacity";a.prototype.enableTransition=function(){this.isTransitioning||(this.css({transitionProperty:m,transitionDuration:this.layout.options.transitionDuration}),this.element.addEventListener(c,this,!1))},a.prototype.transition=a.prototype[u?"_transition":"_nonTransition"],a.prototype.onwebkitTransitionEnd=function(t){this.ontransitionend(t)},a.prototype.onotransitionend=function(t){this.ontransitionend(t)};var g={"-webkit-transform":"transform","-moz-transform":"transform","-o-transform":"transform"};a.prototype.ontransitionend=function(t){if(t.target===this.element){var e=this._transn,o=g[t.propertyName]||t.propertyName;if(delete e.ingProperties[o],i(e.ingProperties)&&this.disableTransition(),o in e.clean&&(this.element.style[t.propertyName]="",delete e.clean[o]),o in e.onEnd){var n=e.onEnd[o];n.call(this),delete e.onEnd[o]}this.emitEvent("transitionEnd",[this])}},a.prototype.disableTransition=function(){this.removeTransitionStyles(),this.element.removeEventListener(c,this,!1),this.isTransitioning=!1},a.prototype._removeStyles=function(t){var e={};for(var i in t)e[i]="";this.css(e)};var v={transitionProperty:"",transitionDuration:""};return a.prototype.removeTransitionStyles=function(){this.css(v)},a.prototype.removeElem=function(){this.element.parentNode.removeChild(this.element),this.emitEvent("remove",[this])},a.prototype.remove=function(){if(!u||!parseFloat(this.layout.options.transitionDuration))return this.removeElem(),void 0;var t=this;this.on("transitionEnd",function(){return t.removeElem(),!0}),this.hide()},a.prototype.reveal=function(){delete this.isHidden,this.css({display:""});var t=this.layout.options;this.transition({from:t.hiddenStyle,to:t.visibleStyle,isCleaning:!0})},a.prototype.hide=function(){this.isHidden=!0,this.css({display:""});var t=this.layout.options;this.transition({from:t.visibleStyle,to:t.hiddenStyle,isCleaning:!0,onTransitionEnd:{opacity:function(){this.isHidden&&this.css({display:"none"})}}})},a.prototype.destroy=function(){this.css({position:"",left:"",right:"",top:"",bottom:"",transition:"",transform:""})},a}var r=t.getComputedStyle,s=r?function(t){return r(t,null)}:function(t){return t.currentStyle};"function"==typeof define&&define.amd?define("outlayer/item",["eventEmitter/EventEmitter","get-size/get-size","get-style-property/get-style-property"],n):(t.Outlayer={},t.Outlayer.Item=n(t.EventEmitter,t.getSize,t.getStyleProperty))}(window),function(t){function e(t,e){for(var i in e)t[i]=e[i];return t}function i(t){return"[object Array]"===f.call(t)}function o(t){var e=[];if(i(t))e=t;else if(t&&"number"==typeof t.length)for(var o=0,n=t.length;n>o;o++)e.push(t[o]);else e.push(t);return e}function n(t,e){var i=d(e,t);-1!==i&&e.splice(i,1)}function r(t){return t.replace(/(.)([A-Z])/g,function(t,e,i){return e+"-"+i}).toLowerCase()}function s(i,s,f,d,l,y){function m(t,i){if("string"==typeof t&&(t=a.querySelector(t)),!t||!c(t))return u&&u.error("Bad "+this.constructor.namespace+" element: "+t),void 0;this.element=t,this.options=e({},this.constructor.defaults),this.option(i);var o=++g;this.element.outlayerGUID=o,v[o]=this,this._create(),this.options.isInitLayout&&this.layout()}var g=0,v={};return m.namespace="outlayer",m.Item=y,m.defaults={containerStyle:{position:"relative"},isInitLayout:!0,isOriginLeft:!0,isOriginTop:!0,isResizeBound:!0,isResizingContainer:!0,transitionDuration:"0.4s",hiddenStyle:{opacity:0,transform:"scale(0.001)"},visibleStyle:{opacity:1,transform:"scale(1)"}},e(m.prototype,f.prototype),m.prototype.option=function(t){e(this.options,t)},m.prototype._create=function(){this.reloadItems(),this.stamps=[],this.stamp(this.options.stamp),e(this.element.style,this.options.containerStyle),this.options.isResizeBound&&this.bindResize()},m.prototype.reloadItems=function(){this.items=this._itemize(this.element.children)},m.prototype._itemize=function(t){for(var e=this._filterFindItemElements(t),i=this.constructor.Item,o=[],n=0,r=e.length;r>n;n++){var s=e[n],a=new i(s,this);o.push(a)}return o},m.prototype._filterFindItemElements=function(t){t=o(t);for(var e=this.options.itemSelector,i=[],n=0,r=t.length;r>n;n++){var s=t[n];if(c(s))if(e){l(s,e)&&i.push(s);for(var a=s.querySelectorAll(e),u=0,p=a.length;p>u;u++)i.push(a[u])}else i.push(s)}return i},m.prototype.getItemElements=function(){for(var t=[],e=0,i=this.items.length;i>e;e++)t.push(this.items[e].element);return t},m.prototype.layout=function(){this._resetLayout(),this._manageStamps();var t=void 0!==this.options.isLayoutInstant?this.options.isLayoutInstant:!this._isLayoutInited;this.layoutItems(this.items,t),this._isLayoutInited=!0},m.prototype._init=m.prototype.layout,m.prototype._resetLayout=function(){this.getSize()},m.prototype.getSize=function(){this.size=d(this.element)},m.prototype._getMeasurement=function(t,e){var i,o=this.options[t];o?("string"==typeof o?i=this.element.querySelector(o):c(o)&&(i=o),this[t]=i?d(i)[e]:o):this[t]=0},m.prototype.layoutItems=function(t,e){t=this._getItemsForLayout(t),this._layoutItems(t,e),this._postLayout()},m.prototype._getItemsForLayout=function(t){for(var e=[],i=0,o=t.length;o>i;i++){var n=t[i];n.isIgnored||e.push(n)}return e},m.prototype._layoutItems=function(t,e){function i(){o.emitEvent("layoutComplete",[o,t])}var o=this;if(!t||!t.length)return i(),void 0;this._itemsOn(t,"layout",i);for(var n=[],r=0,s=t.length;s>r;r++){var a=t[r],u=this._getItemLayoutPosition(a);u.item=a,u.isInstant=e||a.isLayoutInstant,n.push(u)}this._processLayoutQueue(n)},m.prototype._getItemLayoutPosition=function(){return{x:0,y:0}},m.prototype._processLayoutQueue=function(t){for(var e=0,i=t.length;i>e;e++){var o=t[e];this._positionItem(o.item,o.x,o.y,o.isInstant)}},m.prototype._positionItem=function(t,e,i,o){o?t.goTo(e,i):t.moveTo(e,i)},m.prototype._postLayout=function(){this.resizeContainer()},m.prototype.resizeContainer=function(){if(this.options.isResizingContainer){var t=this._getContainerSize();t&&(this._setContainerMeasure(t.width,!0),this._setContainerMeasure(t.height,!1))}},m.prototype._getContainerSize=h,m.prototype._setContainerMeasure=function(t,e){if(void 0!==t){var i=this.size;i.isBorderBox&&(t+=e?i.paddingLeft+i.paddingRight+i.borderLeftWidth+i.borderRightWidth:i.paddingBottom+i.paddingTop+i.borderTopWidth+i.borderBottomWidth),t=Math.max(t,0),this.element.style[e?"width":"height"]=t+"px"}},m.prototype._itemsOn=function(t,e,i){function o(){return n++,n===r&&i.call(s),!0}for(var n=0,r=t.length,s=this,a=0,u=t.length;u>a;a++){var p=t[a];p.on(e,o)}},m.prototype.ignore=function(t){var e=this.getItem(t);e&&(e.isIgnored=!0)},m.prototype.unignore=function(t){var e=this.getItem(t);e&&delete e.isIgnored},m.prototype.stamp=function(t){if(t=this._find(t)){this.stamps=this.stamps.concat(t);for(var e=0,i=t.length;i>e;e++){var o=t[e];this.ignore(o)}}},m.prototype.unstamp=function(t){if(t=this._find(t))for(var e=0,i=t.length;i>e;e++){var o=t[e];n(o,this.stamps),this.unignore(o)}},m.prototype._find=function(t){return t?("string"==typeof t&&(t=this.element.querySelectorAll(t)),t=o(t)):void 0},m.prototype._manageStamps=function(){if(this.stamps&&this.stamps.length){this._getBoundingRect();for(var t=0,e=this.stamps.length;e>t;t++){var i=this.stamps[t];this._manageStamp(i)}}},m.prototype._getBoundingRect=function(){var t=this.element.getBoundingClientRect(),e=this.size;this._boundingRect={left:t.left+e.paddingLeft+e.borderLeftWidth,top:t.top+e.paddingTop+e.borderTopWidth,right:t.right-(e.paddingRight+e.borderRightWidth),bottom:t.bottom-(e.paddingBottom+e.borderBottomWidth)}},m.prototype._manageStamp=h,m.prototype._getElementOffset=function(t){var e=t.getBoundingClientRect(),i=this._boundingRect,o=d(t),n={left:e.left-i.left-o.marginLeft,top:e.top-i.top-o.marginTop,right:i.right-e.right-o.marginRight,bottom:i.bottom-e.bottom-o.marginBottom};return n},m.prototype.handleEvent=function(t){var e="on"+t.type;this[e]&&this[e](t)},m.prototype.bindResize=function(){this.isResizeBound||(i.bind(t,"resize",this),this.isResizeBound=!0)},m.prototype.unbindResize=function(){this.isResizeBound&&i.unbind(t,"resize",this),this.isResizeBound=!1},m.prototype.onresize=function(){function t(){e.resize(),delete e.resizeTimeout}this.resizeTimeout&&clearTimeout(this.resizeTimeout);var e=this;this.resizeTimeout=setTimeout(t,100)},m.prototype.resize=function(){this.isResizeBound&&this.needsResizeLayout()&&this.layout()},m.prototype.needsResizeLayout=function(){var t=d(this.element),e=this.size&&t;return e&&t.innerWidth!==this.size.innerWidth},m.prototype.addItems=function(t){var e=this._itemize(t);return e.length&&(this.items=this.items.concat(e)),e},m.prototype.appended=function(t){var e=this.addItems(t);e.length&&(this.layoutItems(e,!0),this.reveal(e))},m.prototype.prepended=function(t){var e=this._itemize(t);if(e.length){var i=this.items.slice(0);this.items=e.concat(i),this._resetLayout(),this._manageStamps(),this.layoutItems(e,!0),this.reveal(e),this.layoutItems(i)}},m.prototype.reveal=function(t){var e=t&&t.length;if(e)for(var i=0;e>i;i++){var o=t[i];o.reveal()}},m.prototype.hide=function(t){var e=t&&t.length;if(e)for(var i=0;e>i;i++){var o=t[i];o.hide()}},m.prototype.getItem=function(t){for(var e=0,i=this.items.length;i>e;e++){var o=this.items[e];if(o.element===t)return o}},m.prototype.getItems=function(t){if(t&&t.length){for(var e=[],i=0,o=t.length;o>i;i++){var n=t[i],r=this.getItem(n);r&&e.push(r)}return e}},m.prototype.remove=function(t){t=o(t);var e=this.getItems(t);if(e&&e.length){this._itemsOn(e,"remove",function(){this.emitEvent("removeComplete",[this,e])});for(var i=0,r=e.length;r>i;i++){var s=e[i];s.remove(),n(s,this.items)}}},m.prototype.destroy=function(){var t=this.element.style;t.height="",t.position="",t.width="";for(var e=0,i=this.items.length;i>e;e++){var o=this.items[e];o.destroy()}this.unbindResize(),delete this.element.outlayerGUID,p&&p.removeData(this.element,this.constructor.namespace)},m.data=function(t){var e=t&&t.outlayerGUID;return e&&v[e]},m.create=function(t,i){function o(){m.apply(this,arguments)}return Object.create?o.prototype=Object.create(m.prototype):e(o.prototype,m.prototype),o.prototype.constructor=o,o.defaults=e({},m.defaults),e(o.defaults,i),o.prototype.settings={},o.namespace=t,o.data=m.data,o.Item=function(){y.apply(this,arguments)},o.Item.prototype=new y,s(function(){for(var e=r(t),i=a.querySelectorAll(".js-"+e),n="data-"+e+"-options",s=0,h=i.length;h>s;s++){var f,c=i[s],d=c.getAttribute(n);try{f=d&&JSON.parse(d)}catch(l){u&&u.error("Error parsing "+n+" on "+c.nodeName.toLowerCase()+(c.id?"#"+c.id:"")+": "+l);continue}var y=new o(c,f);p&&p.data(c,t,y)}}),p&&p.bridget&&p.bridget(t,o),o},m.Item=y,m}var a=t.document,u=t.console,p=t.jQuery,h=function(){},f=Object.prototype.toString,c="object"==typeof HTMLElement?function(t){return t instanceof HTMLElement}:function(t){return t&&"object"==typeof t&&1===t.nodeType&&"string"==typeof t.nodeName},d=Array.prototype.indexOf?function(t,e){return t.indexOf(e)}:function(t,e){for(var i=0,o=t.length;o>i;i++)if(t[i]===e)return i;return-1};"function"==typeof define&&define.amd?define("outlayer/outlayer",["eventie/eventie","doc-ready/doc-ready","eventEmitter/EventEmitter","get-size/get-size","matches-selector/matches-selector","./item"],s):t.Outlayer=s(t.eventie,t.docReady,t.EventEmitter,t.getSize,t.matchesSelector,t.Outlayer.Item)}(window),function(t){function e(t){function e(){t.Item.apply(this,arguments)}return e.prototype=new t.Item,e.prototype._create=function(){this.id=this.layout.itemGUID++,t.Item.prototype._create.call(this),this.sortData={}},e.prototype.updateSortData=function(){if(!this.isIgnored){this.sortData.id=this.id,this.sortData["original-order"]=this.id,this.sortData.random=Math.random();var t=this.layout.options.getSortData,e=this.layout._sorters;for(var i in t){var o=e[i];this.sortData[i]=o(this.element,this)}}},e}"function"==typeof define&&define.amd?define("isotope/js/item",["outlayer/outlayer"],e):(t.Isotope=t.Isotope||{},t.Isotope.Item=e(t.Outlayer))}(window),function(t){function e(t,e){function i(t){this.isotope=t,t&&(this.options=t.options[this.namespace],this.element=t.element,this.items=t.filteredItems,this.size=t.size)}return function(){function t(t){return function(){return e.prototype[t].apply(this.isotope,arguments)}}for(var o=["_resetLayout","_getItemLayoutPosition","_manageStamp","_getContainerSize","_getElementOffset","needsResizeLayout"],n=0,r=o.length;r>n;n++){var s=o[n];i.prototype[s]=t(s)}}(),i.prototype.needsVerticalResizeLayout=function(){var e=t(this.isotope.element),i=this.isotope.size&&e;return i&&e.innerHeight!==this.isotope.size.innerHeight},i.prototype._getMeasurement=function(){this.isotope._getMeasurement.apply(this,arguments)},i.prototype.getColumnWidth=function(){this.getSegmentSize("column","Width")},i.prototype.getRowHeight=function(){this.getSegmentSize("row","Height")},i.prototype.getSegmentSize=function(t,e){var i=t+e,o="outer"+e;if(this._getMeasurement(i,o),!this[i]){var n=this.getFirstItemSize();this[i]=n&&n[o]||this.isotope.size["inner"+e]}},i.prototype.getFirstItemSize=function(){var e=this.isotope.filteredItems[0];return e&&e.element&&t(e.element)},i.prototype.layout=function(){this.isotope.layout.apply(this.isotope,arguments)},i.prototype.getSize=function(){this.isotope.getSize(),this.size=this.isotope.size},i.modes={},i.create=function(t,e){function o(){i.apply(this,arguments)}return o.prototype=new i,e&&(o.options=e),o.prototype.namespace=t,i.modes[t]=o,o},i}"function"==typeof define&&define.amd?define("isotope/js/layout-mode",["get-size/get-size","outlayer/outlayer"],e):(t.Isotope=t.Isotope||{},t.Isotope.LayoutMode=e(t.getSize,t.Outlayer))}(window),function(t){function e(t,e){var o=t.create("masonry");return o.prototype._resetLayout=function(){this.getSize(),this._getMeasurement("columnWidth","outerWidth"),this._getMeasurement("gutter","outerWidth"),this.measureColumns();var t=this.cols;for(this.colYs=[];t--;)this.colYs.push(0);this.maxY=0},o.prototype.measureColumns=function(){if(this.getContainerWidth(),!this.columnWidth){var t=this.items[0],i=t&&t.element;this.columnWidth=i&&e(i).outerWidth||this.containerWidth}this.columnWidth+=this.gutter,this.cols=Math.floor((this.containerWidth+this.gutter)/this.columnWidth),this.cols=Math.max(this.cols,1)},o.prototype.getContainerWidth=function(){var t=this.options.isFitWidth?this.element.parentNode:this.element,i=e(t);this.containerWidth=i&&i.innerWidth},o.prototype._getItemLayoutPosition=function(t){t.getSize();var e=t.size.outerWidth%this.columnWidth,o=e&&1>e?"round":"ceil",n=Math[o](t.size.outerWidth/this.columnWidth);n=Math.min(n,this.cols);for(var r=this._getColGroup(n),s=Math.min.apply(Math,r),a=i(r,s),u={x:this.columnWidth*a,y:s},p=s+t.size.outerHeight,h=this.cols+1-r.length,f=0;h>f;f++)this.colYs[a+f]=p;return u},o.prototype._getColGroup=function(t){if(2>t)return this.colYs;for(var e=[],i=this.cols+1-t,o=0;i>o;o++){var n=this.colYs.slice(o,o+t);e[o]=Math.max.apply(Math,n)}return e},o.prototype._manageStamp=function(t){var i=e(t),o=this._getElementOffset(t),n=this.options.isOriginLeft?o.left:o.right,r=n+i.outerWidth,s=Math.floor(n/this.columnWidth);s=Math.max(0,s);var a=Math.floor(r/this.columnWidth);a-=r%this.columnWidth?0:1,a=Math.min(this.cols-1,a);for(var u=(this.options.isOriginTop?o.top:o.bottom)+i.outerHeight,p=s;a>=p;p++)this.colYs[p]=Math.max(u,this.colYs[p])},o.prototype._getContainerSize=function(){this.maxY=Math.max.apply(Math,this.colYs);var t={height:this.maxY};return this.options.isFitWidth&&(t.width=this._getContainerFitWidth()),t},o.prototype._getContainerFitWidth=function(){for(var t=0,e=this.cols;--e&&0===this.colYs[e];)t++;return(this.cols-t)*this.columnWidth-this.gutter},o.prototype.needsResizeLayout=function(){var t=this.containerWidth;return this.getContainerWidth(),t!==this.containerWidth},o}var i=Array.prototype.indexOf?function(t,e){return t.indexOf(e)}:function(t,e){for(var i=0,o=t.length;o>i;i++){var n=t[i];if(n===e)return i}return-1};"function"==typeof define&&define.amd?define("masonry/masonry",["outlayer/outlayer","get-size/get-size"],e):t.Masonry=e(t.Outlayer,t.getSize)}(window),function(t){function e(t,e){for(var i in e)t[i]=e[i];return t}function i(t,i){var o=t.create("masonry"),n=o.prototype._getElementOffset,r=o.prototype.layout,s=o.prototype._getMeasurement;e(o.prototype,i.prototype),o.prototype._getElementOffset=n,o.prototype.layout=r,o.prototype._getMeasurement=s;var a=o.prototype.measureColumns;o.prototype.measureColumns=function(){this.items=this.isotope.filteredItems,a.call(this)};var u=o.prototype._manageStamp;return o.prototype._manageStamp=function(){this.options.isOriginLeft=this.isotope.options.isOriginLeft,this.options.isOriginTop=this.isotope.options.isOriginTop,u.apply(this,arguments)},o}"function"==typeof define&&define.amd?define("isotope/js/layout-modes/masonry",["../layout-mode","masonry/masonry"],i):i(t.Isotope.LayoutMode,t.Masonry)}(window),function(t){function e(t){var e=t.create("fitRows");return e.prototype._resetLayout=function(){this.x=0,this.y=0,this.maxY=0},e.prototype._getItemLayoutPosition=function(t){t.getSize(),0!==this.x&&t.size.outerWidth+this.x>this.isotope.size.innerWidth&&(this.x=0,this.y=this.maxY);var e={x:this.x,y:this.y};return this.maxY=Math.max(this.maxY,this.y+t.size.outerHeight),this.x+=t.size.outerWidth,e},e.prototype._getContainerSize=function(){return{height:this.maxY}},e}"function"==typeof define&&define.amd?define("isotope/js/layout-modes/fit-rows",["../layout-mode"],e):e(t.Isotope.LayoutMode)}(window),function(t){function e(t){var e=t.create("vertical",{horizontalAlignment:0});return e.prototype._resetLayout=function(){this.y=0},e.prototype._getItemLayoutPosition=function(t){t.getSize();var e=(this.isotope.size.innerWidth-t.size.outerWidth)*this.options.horizontalAlignment,i=this.y;return this.y+=t.size.outerHeight,{x:e,y:i}},e.prototype._getContainerSize=function(){return{height:this.y}},e}"function"==typeof define&&define.amd?define("isotope/js/layout-modes/vertical",["../layout-mode"],e):e(t.Isotope.LayoutMode)}(window),function(t){function e(t,e){for(var i in e)t[i]=e[i];return t}function i(t){return"[object Array]"===h.call(t)}function o(t){var e=[];if(i(t))e=t;else if(t&&"number"==typeof t.length)for(var o=0,n=t.length;n>o;o++)e.push(t[o]);else e.push(t);return e}function n(t,e){var i=f(e,t);-1!==i&&e.splice(i,1)}function r(t,i,r,u,h){function f(t,e){return function(i,o){for(var n=0,r=t.length;r>n;n++){var s=t[n],a=i.sortData[s],u=o.sortData[s];if(a>u||u>a){var p=void 0!==e[s]?e[s]:e,h=p?1:-1;return(a>u?1:-1)*h}}return 0}}var c=t.create("isotope",{layoutMode:"masonry",isJQueryFiltering:!0,sortAscending:!0});c.Item=u,c.LayoutMode=h,c.prototype._create=function(){this.itemGUID=0,this._sorters={},this._getSorters(),t.prototype._create.call(this),this.modes={},this.filteredItems=this.items,this.sortHistory=["original-order"];for(var e in h.modes)this._initLayoutMode(e)},c.prototype.reloadItems=function(){this.itemGUID=0,t.prototype.reloadItems.call(this)},c.prototype._itemize=function(){for(var e=t.prototype._itemize.apply(this,arguments),i=0,o=e.length;o>i;i++){var n=e[i];n.id=this.itemGUID++}return this._updateItemsSortData(e),e},c.prototype._initLayoutMode=function(t){var i=h.modes[t],o=this.options[t]||{};this.options[t]=i.options?e(i.options,o):o,this.modes[t]=new i(this)},c.prototype.layout=function(){return!this._isLayoutInited&&this.options.isInitLayout?(this.arrange(),void 0):(this._layout(),void 0)},c.prototype._layout=function(){var t=this._getIsInstant();this._resetLayout(),this._manageStamps(),this.layoutItems(this.filteredItems,t),this._isLayoutInited=!0},c.prototype.arrange=function(t){this.option(t),this._getIsInstant(),this.filteredItems=this._filter(this.items),this._sort(),this._layout()},c.prototype._init=c.prototype.arrange,c.prototype._getIsInstant=function(){var t=void 0!==this.options.isLayoutInstant?this.options.isLayoutInstant:!this._isLayoutInited;return this._isInstant=t,t},c.prototype._filter=function(t){function e(){f.reveal(n),f.hide(r)}var i=this.options.filter;i=i||"*";for(var o=[],n=[],r=[],s=this._getFilterTest(i),a=0,u=t.length;u>a;a++){var p=t[a];if(!p.isIgnored){var h=s(p);h&&o.push(p),h&&p.isHidden?n.push(p):h||p.isHidden||r.push(p)}}var f=this;return this._isInstant?this._noTransition(e):e(),o},c.prototype._getFilterTest=function(t){return s&&this.options.isJQueryFiltering?function(e){return s(e.element).is(t)}:"function"==typeof t?function(e){return t(e.element)}:function(e){return r(e.element,t)}},c.prototype.updateSortData=function(t){this._getSorters(),t=o(t);var e=this.getItems(t);e=e.length?e:this.items,this._updateItemsSortData(e)
},c.prototype._getSorters=function(){var t=this.options.getSortData;for(var e in t){var i=t[e];this._sorters[e]=d(i)}},c.prototype._updateItemsSortData=function(t){for(var e=0,i=t.length;i>e;e++){var o=t[e];o.updateSortData()}};var d=function(){function t(t){if("string"!=typeof t)return t;var i=a(t).split(" "),o=i[0],n=o.match(/^\[(.+)\]$/),r=n&&n[1],s=e(r,o),u=c.sortDataParsers[i[1]];return t=u?function(t){return t&&u(s(t))}:function(t){return t&&s(t)}}function e(t,e){var i;return i=t?function(e){return e.getAttribute(t)}:function(t){var i=t.querySelector(e);return i&&p(i)}}return t}();c.sortDataParsers={parseInt:function(t){return parseInt(t,10)},parseFloat:function(t){return parseFloat(t)}},c.prototype._sort=function(){var t=this.options.sortBy;if(t){var e=[].concat.apply(t,this.sortHistory),i=f(e,this.options.sortAscending);this.filteredItems.sort(i),t!==this.sortHistory[0]&&this.sortHistory.unshift(t)}},c.prototype._mode=function(){var t=this.options.layoutMode,e=this.modes[t];if(!e)throw Error("No layout mode: "+t);return e.options=this.options[t],e},c.prototype._resetLayout=function(){t.prototype._resetLayout.call(this),this._mode()._resetLayout()},c.prototype._getItemLayoutPosition=function(t){return this._mode()._getItemLayoutPosition(t)},c.prototype._manageStamp=function(t){this._mode()._manageStamp(t)},c.prototype._getContainerSize=function(){return this._mode()._getContainerSize()},c.prototype.needsResizeLayout=function(){return this._mode().needsResizeLayout()},c.prototype.appended=function(t){var e=this.addItems(t);if(e.length){var i=this._filterRevealAdded(e);this.filteredItems=this.filteredItems.concat(i)}},c.prototype.prepended=function(t){var e=this._itemize(t);if(e.length){var i=this.items.slice(0);this.items=e.concat(i),this._resetLayout(),this._manageStamps();var o=this._filterRevealAdded(e);this.layoutItems(i),this.filteredItems=o.concat(this.filteredItems)}},c.prototype._filterRevealAdded=function(t){var e=this._noTransition(function(){return this._filter(t)});return this.layoutItems(e,!0),this.reveal(e),t},c.prototype.insert=function(t){var e=this.addItems(t);if(e.length){var i,o,n=e.length;for(i=0;n>i;i++)o=e[i],this.element.appendChild(o.element);var r=this._filter(e);for(this._noTransition(function(){this.hide(r)}),i=0;n>i;i++)e[i].isLayoutInstant=!0;for(this.arrange(),i=0;n>i;i++)delete e[i].isLayoutInstant;this.reveal(r)}};var l=c.prototype.remove;return c.prototype.remove=function(t){t=o(t);var e=this.getItems(t);if(l.call(this,t),e&&e.length)for(var i=0,r=e.length;r>i;i++){var s=e[i];n(s,this.filteredItems)}},c.prototype._noTransition=function(t){var e=this.options.transitionDuration;this.options.transitionDuration=0;var i=t.call(this);return this.options.transitionDuration=e,i},c}var s=t.jQuery,a=String.prototype.trim?function(t){return t.trim()}:function(t){return t.replace(/^\s+|\s+$/g,"")},u=document.documentElement,p=u.textContent?function(t){return t.textContent}:function(t){return t.innerText},h=Object.prototype.toString,f=Array.prototype.indexOf?function(t,e){return t.indexOf(e)}:function(t,e){for(var i=0,o=t.length;o>i;i++)if(t[i]===e)return i;return-1};"function"==typeof define&&define.amd?define(["outlayer/outlayer","get-size/get-size","matches-selector/matches-selector","isotope/js/item","isotope/js/layout-mode","isotope/js/layout-modes/masonry","isotope/js/layout-modes/fit-rows","isotope/js/layout-modes/vertical"],r):t.Isotope=r(t.Outlayer,t.getSize,t.matchesSelector,t.Isotope.Item,t.Isotope.LayoutMode)}(window);
// Generated by CoffeeScript 1.6.2
/*!
jQuery Waypoints - v2.0.5
Copyright (c) 2011-2014 Caleb Troughton
Licensed under the MIT license.
https://github.com/imakewebthings/jquery-waypoints/blob/master/licenses.txt
*/

(function(){var t=[].indexOf||function(t){for(var e=0,n=this.length;e<n;e++){if(e in this&&this[e]===t)return e}return-1},e=[].slice;(function(t,e){if(typeof define==="function"&&define.amd){return define("waypoints",["jquery"],function(n){return e(n,t)})}else{return e(t.jQuery,t)}})(window,function(n,r){var i,o,l,s,f,u,c,a,h,d,p,y,v,w,g,m;i=n(r);a=t.call(r,"ontouchstart")>=0;s={horizontal:{},vertical:{}};f=1;c={};u="waypoints-context-id";p="resize.waypoints";y="scroll.waypoints";v=1;w="waypoints-waypoint-ids";g="waypoint";m="waypoints";o=function(){function t(t){var e=this;this.$element=t;this.element=t[0];this.didResize=false;this.didScroll=false;this.id="context"+f++;this.oldScroll={x:t.scrollLeft(),y:t.scrollTop()};this.waypoints={horizontal:{},vertical:{}};this.element[u]=this.id;c[this.id]=this;t.bind(y,function(){var t;if(!(e.didScroll||a)){e.didScroll=true;t=function(){e.doScroll();return e.didScroll=false};return r.setTimeout(t,n[m].settings.scrollThrottle)}});t.bind(p,function(){var t;if(!e.didResize){e.didResize=true;t=function(){n[m]("refresh");return e.didResize=false};return r.setTimeout(t,n[m].settings.resizeThrottle)}})}t.prototype.doScroll=function(){var t,e=this;t={horizontal:{newScroll:this.$element.scrollLeft(),oldScroll:this.oldScroll.x,forward:"right",backward:"left"},vertical:{newScroll:this.$element.scrollTop(),oldScroll:this.oldScroll.y,forward:"down",backward:"up"}};if(a&&(!t.vertical.oldScroll||!t.vertical.newScroll)){n[m]("refresh")}n.each(t,function(t,r){var i,o,l;l=[];o=r.newScroll>r.oldScroll;i=o?r.forward:r.backward;n.each(e.waypoints[t],function(t,e){var n,i;if(r.oldScroll<(n=e.offset)&&n<=r.newScroll){return l.push(e)}else if(r.newScroll<(i=e.offset)&&i<=r.oldScroll){return l.push(e)}});l.sort(function(t,e){return t.offset-e.offset});if(!o){l.reverse()}return n.each(l,function(t,e){if(e.options.continuous||t===l.length-1){return e.trigger([i])}})});return this.oldScroll={x:t.horizontal.newScroll,y:t.vertical.newScroll}};t.prototype.refresh=function(){var t,e,r,i=this;r=n.isWindow(this.element);e=this.$element.offset();this.doScroll();t={horizontal:{contextOffset:r?0:e.left,contextScroll:r?0:this.oldScroll.x,contextDimension:this.$element.width(),oldScroll:this.oldScroll.x,forward:"right",backward:"left",offsetProp:"left"},vertical:{contextOffset:r?0:e.top,contextScroll:r?0:this.oldScroll.y,contextDimension:r?n[m]("viewportHeight"):this.$element.height(),oldScroll:this.oldScroll.y,forward:"down",backward:"up",offsetProp:"top"}};return n.each(t,function(t,e){return n.each(i.waypoints[t],function(t,r){var i,o,l,s,f;i=r.options.offset;l=r.offset;o=n.isWindow(r.element)?0:r.$element.offset()[e.offsetProp];if(n.isFunction(i)){i=i.apply(r.element)}else if(typeof i==="string"){i=parseFloat(i);if(r.options.offset.indexOf("%")>-1){i=Math.ceil(e.contextDimension*i/100)}}r.offset=o-e.contextOffset+e.contextScroll-i;if(r.options.onlyOnScroll&&l!=null||!r.enabled){return}if(l!==null&&l<(s=e.oldScroll)&&s<=r.offset){return r.trigger([e.backward])}else if(l!==null&&l>(f=e.oldScroll)&&f>=r.offset){return r.trigger([e.forward])}else if(l===null&&e.oldScroll>=r.offset){return r.trigger([e.forward])}})})};t.prototype.checkEmpty=function(){if(n.isEmptyObject(this.waypoints.horizontal)&&n.isEmptyObject(this.waypoints.vertical)){this.$element.unbind([p,y].join(" "));return delete c[this.id]}};return t}();l=function(){function t(t,e,r){var i,o;if(r.offset==="bottom-in-view"){r.offset=function(){var t;t=n[m]("viewportHeight");if(!n.isWindow(e.element)){t=e.$element.height()}return t-n(this).outerHeight()}}this.$element=t;this.element=t[0];this.axis=r.horizontal?"horizontal":"vertical";this.callback=r.handler;this.context=e;this.enabled=r.enabled;this.id="waypoints"+v++;this.offset=null;this.options=r;e.waypoints[this.axis][this.id]=this;s[this.axis][this.id]=this;i=(o=this.element[w])!=null?o:[];i.push(this.id);this.element[w]=i}t.prototype.trigger=function(t){if(!this.enabled){return}if(this.callback!=null){this.callback.apply(this.element,t)}if(this.options.triggerOnce){return this.destroy()}};t.prototype.disable=function(){return this.enabled=false};t.prototype.enable=function(){this.context.refresh();return this.enabled=true};t.prototype.destroy=function(){delete s[this.axis][this.id];delete this.context.waypoints[this.axis][this.id];return this.context.checkEmpty()};t.getWaypointsByElement=function(t){var e,r;r=t[w];if(!r){return[]}e=n.extend({},s.horizontal,s.vertical);return n.map(r,function(t){return e[t]})};return t}();d={init:function(t,e){var r;e=n.extend({},n.fn[g].defaults,e);if((r=e.handler)==null){e.handler=t}this.each(function(){var t,r,i,s;t=n(this);i=(s=e.context)!=null?s:n.fn[g].defaults.context;if(!n.isWindow(i)){i=t.closest(i)}i=n(i);r=c[i[0][u]];if(!r){r=new o(i)}return new l(t,r,e)});n[m]("refresh");return this},disable:function(){return d._invoke.call(this,"disable")},enable:function(){return d._invoke.call(this,"enable")},destroy:function(){return d._invoke.call(this,"destroy")},prev:function(t,e){return d._traverse.call(this,t,e,function(t,e,n){if(e>0){return t.push(n[e-1])}})},next:function(t,e){return d._traverse.call(this,t,e,function(t,e,n){if(e<n.length-1){return t.push(n[e+1])}})},_traverse:function(t,e,i){var o,l;if(t==null){t="vertical"}if(e==null){e=r}l=h.aggregate(e);o=[];this.each(function(){var e;e=n.inArray(this,l[t]);return i(o,e,l[t])});return this.pushStack(o)},_invoke:function(t){this.each(function(){var e;e=l.getWaypointsByElement(this);return n.each(e,function(e,n){n[t]();return true})});return this}};n.fn[g]=function(){var t,r;r=arguments[0],t=2<=arguments.length?e.call(arguments,1):[];if(d[r]){return d[r].apply(this,t)}else if(n.isFunction(r)){return d.init.apply(this,arguments)}else if(n.isPlainObject(r)){return d.init.apply(this,[null,r])}else if(!r){return n.error("jQuery Waypoints needs a callback function or handler option.")}else{return n.error("The "+r+" method does not exist in jQuery Waypoints.")}};n.fn[g].defaults={context:r,continuous:true,enabled:true,horizontal:false,offset:0,triggerOnce:false};h={refresh:function(){return n.each(c,function(t,e){return e.refresh()})},viewportHeight:function(){var t;return(t=r.innerHeight)!=null?t:i.height()},aggregate:function(t){var e,r,i;e=s;if(t){e=(i=c[n(t)[0][u]])!=null?i.waypoints:void 0}if(!e){return[]}r={horizontal:[],vertical:[]};n.each(r,function(t,i){n.each(e[t],function(t,e){return i.push(e)});i.sort(function(t,e){return t.offset-e.offset});r[t]=n.map(i,function(t){return t.element});return r[t]=n.unique(r[t])});return r},above:function(t){if(t==null){t=r}return h._filter(t,"vertical",function(t,e){return e.offset<=t.oldScroll.y})},below:function(t){if(t==null){t=r}return h._filter(t,"vertical",function(t,e){return e.offset>t.oldScroll.y})},left:function(t){if(t==null){t=r}return h._filter(t,"horizontal",function(t,e){return e.offset<=t.oldScroll.x})},right:function(t){if(t==null){t=r}return h._filter(t,"horizontal",function(t,e){return e.offset>t.oldScroll.x})},enable:function(){return h._invoke("enable")},disable:function(){return h._invoke("disable")},destroy:function(){return h._invoke("destroy")},extendFn:function(t,e){return d[t]=e},_invoke:function(t){var e;e=n.extend({},s.vertical,s.horizontal);return n.each(e,function(e,n){n[t]();return true})},_filter:function(t,e,r){var i,o;i=c[n(t)[0][u]];if(!i){return[]}o=[];n.each(i.waypoints[e],function(t,e){if(r(i,e)){return o.push(e)}});o.sort(function(t,e){return t.offset-e.offset});return n.map(o,function(t){return t.element})}};n[m]=function(){var t,n;n=arguments[0],t=2<=arguments.length?e.call(arguments,1):[];if(h[n]){return h[n].apply(null,t)}else{return h.aggregate.call(null,n)}};n[m].settings={resizeThrottle:100,scrollThrottle:30};return i.on("load.waypoints",function(){return n[m]("refresh")})})}).call(this);
/*
 * debouncedresize: special jQuery event that happens once after a window resize
 *
 * latest version and complete README available on Github:
 * https://github.com/louisremi/jquery-smartresize/blob/master/jquery.debouncedresize.js
 *
 * Copyright 2011 @louis_remi
 * Licensed under the MIT license.
 */

var $event = $.event,
    $special,
    resizeTimeout;

$special = $event.special.debouncedresize = {
    setup: function () {
        $(this).on("resize", $special.handler);
    },
    teardown: function () {
        $(this).off("resize", $special.handler);
    },
    handler: function (event, execAsap) {
        // Save the context
        var context = this,
            args = arguments,
            dispatch = function () {
                // set correct event type
                event.type = "debouncedresize";
                $event.dispatch.apply(context, args);
            };

        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }

        execAsap ?
            dispatch() :
            resizeTimeout = setTimeout(dispatch, $special.threshold);
    },
    threshold: 250
};

// ======================= imagesLoaded Plugin ===============================
// https://github.com/desandro/imagesloaded

// $('#my-container').imagesLoaded(myFunction)
// execute a callback when all images have loaded.
// needed because .load() doesn't work on cached images

// callback function gets image collection as argument
//  this is the container

// original: MIT license. Paul Irish. 2010.
// contributors: Oren Solomianik, David DeSandro, Yiannis Chatzikonstantinou

// blank image data-uri bypasses webkit log warning (thx doug jones)
var BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

$.fn.imagesLoaded = function (callback) {
    var $this = this,
        deferred = $.isFunction($.Deferred) ? $.Deferred() : 0,
        hasNotify = $.isFunction(deferred.notify),
        $images = $this.find('img').add($this.filter('img')),
        loaded = [],
        proper = [],
        broken = [];

    // Register deferred callbacks
    if ($.isPlainObject(callback)) {
        $.each(callback, function (key, value) {
            if (key === 'callback') {
                callback = value;
            } else if (deferred) {
                deferred[key](value);
            }
        });
    }

    function doneLoading() {
        var $proper = $(proper),
            $broken = $(broken);

        if (deferred) {
            if (broken.length) {
                deferred.reject($images, $proper, $broken);
            } else {
                deferred.resolve($images);
            }
        }

        if ($.isFunction(callback)) {
            callback.call($this, $images, $proper, $broken);
        }
    }

    function imgLoaded(img, isBroken) {
        // don't proceed if BLANK image, or image is already loaded
        if (img.src === BLANK || $.inArray(img, loaded) !== -1) {
            return;
        }

        // store element in loaded images array
        loaded.push(img);

        // keep track of broken and properly loaded images
        if (isBroken) {
            broken.push(img);
        } else {
            proper.push(img);
        }

        // cache image and its state for future calls
        $.data(img, 'imagesLoaded', {
            isBroken: isBroken,
            src: img.src
        });

        // trigger deferred progress method if present
        if (hasNotify) {
            deferred.notifyWith($(img), [isBroken, $images, $(proper), $(broken)]);
        }

        // call doneLoading and clean listeners if all images are loaded
        if ($images.length === loaded.length) {
            setTimeout(doneLoading);
            $images.unbind('.imagesLoaded');
        }
    }

    // if no images, trigger immediately
    if (!$images.length) {
        doneLoading();
    } else {
        $images.bind('load.imagesLoaded error.imagesLoaded', function (event) {
            // trigger imgLoaded
            imgLoaded(event.target, event.type === 'error');
        }).each(function (i, el) {
            var src = el.src;

            // find out if this image has been already checked for status
            // if it was, and src has not changed, call imgLoaded on it
            var cached = $.data(el, 'imagesLoaded');
            if (cached && cached.src === src) {
                imgLoaded(el, cached.isBroken);
                return;
            }

            // if complete is true and browser supports natural sizes, try
            // to check for image status manually
            if (el.complete && el.naturalWidth !== undefined) {
                imgLoaded(el, el.naturalWidth === 0 || el.naturalHeight === 0);
                return;
            }

            // cached images don't fire load sometimes, so we reset src, but only when
            // dealing with IE, or image is complete (loaded) and failed manual check
            // webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
            if (el.readyState || el.complete) {
                el.src = BLANK;
                el.src = src;
            }
        });
    }

    return deferred ? deferred.promise($this) : $this;
};

Grid = (function () {

    // list of items
    var $grid = $('#og-grid'),
        // the items
        $items = $grid.children('li'),
        // current expanded item's index
        current = -1,
        // position (top) of the expanded item
        // used to know if the preview will expand in a different row
        previewPos = -1,
        // extra amount of pixels to scroll the window
        scrollExtra = 0,
        // extra margin when expanded (between preview overlay and the next items)
        marginExpanded = 10,
        $window = $(window),
        winsize,
        $body = $('html, body'),
        // transitionend events
        transEndEventNames = {
            'WebkitTransition': 'webkitTransitionEnd',
            'MozTransition': 'transitionend',
            'OTransition': 'oTransitionEnd',
            'msTransition': 'MSTransitionEnd',
            'transition': 'transitionend'
        },
        transEndEventName = transEndEventNames[Modernizr.prefixed('transition')],
        // support for csstransitions
        support = Modernizr.csstransitions,
        // default settings
        settings = {
            minHeight: 500,
            speed: 350,
            easing: 'ease'
        };

    function init(config) {

        // the settings..
        settings = $.extend(true, {}, settings, config);

        // preload all images
        $grid.imagesLoaded(function () {

            // save item´s size and offset
            saveItemInfo(true);
            // get window´s size
            getWinSize();
            // initialize some events
            initEvents();

        });

    }

    // add more items to the grid.
    // the new items need to appended to the grid.
    // after that call Grid.addItems(theItems);
    function addItems($newitems) {

        $items = $items.add($newitems);

        $.each($newitems, function (i, v) {
            var $item = $(v);
            $item.data({
                offsetTop: $item.offset().top,
                height: $item.height()
            });
        });

        initItemsEvents($newitems);

    }

    // saves the item´s offset top and height (if saveheight is true)
    function saveItemInfo(saveheight) {
        $items.each(function () {
            var $item = $(this);
            $item.data('offsetTop', $item.offset().top);
            if (saveheight) {
                $item.data('height', $item.height());
            }
        });
    }

    function initEvents() {

        // when clicking an item, show the preview with the item´s info and large image.
        // close the item if already expanded.
        // also close if clicking on the item´s cross
        initItemsEvents($items);

        // on window resize get the window´s size again
        // reset some values..
        $window.on('debouncedresize', function () {

            scrollExtra = 0;
            previewPos = -1;
            // save item´s offset
            saveItemInfo();
            getWinSize();
            var preview = $.data(this, 'preview');
            if (typeof preview != 'undefined') {
                hidePreview(); 
            }

        });
 
    }

    function initItemsEvents($items) {
        $.each($items, function (i, v) {
            $(v).on('click', 'span.og-close', function () {
                hidePreview();
                return false;
            }).children('a').on('click', function (e) {

                var $item = $(this).parent();
                // check if item already opened
                current === $item.index() ? hidePreview() : showPreview($item);
                return false;

            });
        });
    }

    function getWinSize() {
        winsize = {
            width: $window.width(),
            height: $window.height()
        };
    }

    function showPreview($item) {

        var preview = $.data(this, 'preview'),
            // item´s offset top
            position = $item.data('offsetTop');

        scrollExtra = 0;

        // if a preview exists and previewPos is different (different row) from item´s top then close it
        if (typeof preview != 'undefined') {

            // not in the same row
            if (previewPos !== position) {
                // if position > previewPos then we need to take te current preview´s height in consideration when scrolling the window
                if (position > previewPos) {
                    scrollExtra = preview.height;
                }
                hidePreview();
            }
            // same row
            else {
                preview.update($item);
                return false;
            }

        }

        // update previewPos
        previewPos = position;
        // initialize new preview for the clicked item
        preview = $.data(this, 'preview', new Preview($item));
        // expand preview overlay
        preview.open();

    }

    function hidePreview() {
        current = -1;
        var preview = $.data(this, 'preview');
        preview.close();
        $.removeData(this, 'preview');
    }

    // the preview obj / overlay
    function Preview($item) {
        this.$item = $item;
        this.expandedIdx = this.$item.index();
        this.create();
        this.update();
    }

    Preview.prototype = {
        create: function () {
            // create Preview structure:
            this.$title = $('<h3></h3>');
            //this.$date = $('<span></span>');
            this.$category = $('<span></span>');
            this.$description = $('<p></p>');

            //this.$href = $('<a href="#">Visit website</a>');
            this.$details = $('<div class="og-details"></div>').append(this.$title, this.$date, this.$category, this.$description, this.$href);
            this.$loading = $('<div class="og-loading"></div>');
            this.$fullimage = $('<div class="og-fullimg"></div>').append(this.$loading);
            this.$closePreview = $('<span class="og-close"></span>');
            this.$previewInner = $('<div class="og-expander-inner"></div>').append(this.$closePreview, this.$fullimage, this.$details);
            this.$previewEl = $('<div class="og-expander"></div>').append(this.$previewInner);
            // append preview element to the item
            this.$item.append(this.getEl());
            // set the transitions for the preview and the item
            if (support) {
                this.setTransition();
            }
        },
        update: function ($item) {

            if ($item) {
                this.$item = $item;
            }

            // if already expanded remove class "og-expanded" from current item and add it to new item
            if (current !== -1) {
                var $currentItem = $items.eq(current);
                $currentItem.removeClass('og-expanded');
                this.$item.addClass('og-expanded');
                // position the preview correctly
                this.positionPreview();
            }

            // update current value
            current = this.$item.index();

            // update preview´s content
            var $itemEl = this.$item.children('a'),
                eldata = {
                    href: $itemEl.attr('href'),
                    largesrc: $itemEl.data('largesrc'),
                    title: $itemEl.data('title'),
                    date: $itemEl.data('date'),
                    description: $itemEl.data('description'),
                    category: $itemEl.data('category')
                };

            this.$title.html(eldata.title);
            //this.$date.html(eldata.date);
            this.$description.html(eldata.description);
            this.$category.html(eldata.category);
            //this.$href.attr('href', eldata.href);

            var self = this;

            // remove the current image in the preview
            if (typeof self.$largeImg != 'undefined') {
                self.$largeImg.remove();
            }

            // preload large image and add it to the preview
            // for smaller screens we don´t display the large image (the media query will hide the fullimage wrapper)
            if (self.$fullimage.is(':visible')) {
                this.$loading.show();
                $('<img/>').load(function () {
                    var $img = $(this);
                    if ($img.attr('src') === self.$item.children('a').data('largesrc')) {
                        self.$loading.hide();
                        self.$fullimage.find('img').remove();
                        self.$largeImg = $img.fadeIn(350);
                        self.$fullimage.append(self.$largeImg);
                    }
                }).attr('src', eldata.largesrc);
            }

        },
        open: function () {
            
            setTimeout($.proxy(function () {
                // set the height for the preview and the item
                this.setHeights();
                // scroll to position the preview in the right place
                this.positionPreview();
            }, this), 25);
        },
        close: function () {

            var self = this,
                onEndFn = function () {
                    if (support) {
                        $(this).off(transEndEventName);
                    }
                    self.$item.removeClass('og-expanded');
                    self.$previewEl.remove();
                };

            setTimeout($.proxy(function () {

                if (typeof this.$largeImg !== 'undefined') {
                    this.$largeImg.fadeOut('fast');
                }
                this.$previewEl.css('height', 0);
                // the current expanded item (might be different from this.$item)
                var $expandedItem = $items.eq(this.expandedIdx);
                $expandedItem.css('height', $expandedItem.data('height')).on(transEndEventName, onEndFn);

                if (!support) {
                    onEndFn.call();
                }

            }, this), 25);

            return false;

        },
        calcHeight: function () {

            var heightPreview = winsize.height - this.$item.data('height') - marginExpanded,
                itemHeight = winsize.height;

            if (heightPreview < settings.minHeight) {
                heightPreview = settings.minHeight;
                itemHeight = settings.minHeight + this.$item.data('height') + marginExpanded;
            }

            this.height = heightPreview;
            this.itemHeight = itemHeight;

        },
        setHeights: function () {

            var self = this,
                onEndFn = function () {
                    if (support) {
                        self.$item.off(transEndEventName);
                    }
                    self.$item.addClass('og-expanded');
                };

            this.calcHeight();
            this.$previewEl.css('height', this.height);
            this.$item.css('height', this.itemHeight).on(transEndEventName, onEndFn);

            if (!support) {
                onEndFn.call();
            }

        },
        positionPreview: function () {

            // scroll page
            // case 1 : preview height + item height fits in window´s height
            // case 2 : preview height + item height does not fit in window´s height and preview height is smaller than window´s height
            // case 3 : preview height + item height does not fit in window´s height and preview height is bigger than window´s height
            var position = this.$item.data('offsetTop'),
                previewOffsetT = this.$previewEl.offset().top - scrollExtra,
                scrollVal = this.height + this.$item.data('height') + marginExpanded <= winsize.height ? position : this.height < winsize.height ? previewOffsetT - (winsize.height - this.height) : previewOffsetT;

            $body.animate({
                scrollTop: scrollVal
            }, settings.speed);

        },
        setTransition: function () {
            this.$previewEl.css('transition', 'height ' + settings.speed + 'ms ' + settings.easing);
            this.$item.css('transition', 'height ' + settings.speed + 'ms ' + settings.easing);
        },
        getEl: function () {
            return this.$previewEl;
        }
    }

    return {
        init: init,
        addItems: addItems
    };


})();
jQuery(document).ready(function ($) {

    replaceThumbnailWithIframe = function (e, autoplay) {
        id = e.getAttribute('data-youtube-id');
        var autoplayBit = 1
        if (!autoplay) autoplayBit = 0;
        inner = '<iframe class="youtubePlayer" src="https://www.youtube.com/embed/' + id + '?autoplay=' + autoplayBit + '&showinfo=0&autohide=1&border=0&wmode=opaque&rel=0&enablejsapi=1" frameborder="0" allowfullscreen></iframe>';
        e.innerHTML = inner;
    }

    $('.BetterTube').each(function (i, e) {
        //if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
        if (/iPhone|iPad|iPod|IEMobile/i.test(navigator.userAgent)) {
            replaceThumbnailWithIframe(e, false);
        } else {
            $(e).on('click', function () {
                replaceThumbnailWithIframe(e, true)
            });
        }
    });

});
/*! Superslides - v0.6.2 - 2013-07-10
* https://github.com/nicinabox/superslides
* Copyright (c) 2013 Nic Aitch; Licensed MIT */

(function(i,t){var n,e="superslides";n=function(n,e){this.options=t.extend({play:!1,animation_speed:600,animation_easing:"swing",animation:"slide",inherit_width_from:i,inherit_height_from:i,pagination:!0,hashchange:!1,scrollable:!0,elements:{preserve:".preserve",nav:".slides-navigation",container:".slides-container",pagination:".slides-pagination"}},e);var s=this,o=t("<div>",{"class":"slides-control"}),a=1;this.$el=t(n),this.$container=this.$el.find(this.options.elements.container);var r=function(){return a=s._findMultiplier(),s.$el.on("click",s.options.elements.nav+" a",function(i){i.preventDefault(),s.stop(),t(this).hasClass("next")?s.animate("next",function(){s.start()}):s.animate("prev",function(){s.start()})}),t(document).on("keyup",function(i){37===i.keyCode&&s.animate("prev"),39===i.keyCode&&s.animate("next")}),t(i).on("resize",function(){setTimeout(function(){var i=s.$container.children();s.width=s._findWidth(),s.height=s._findHeight(),i.css({width:s.width,left:s.width}),s.css.containers(),s.css.images()},10)}),t(i).on("hashchange",function(){var i,t=s._parseHash();i=t&&!isNaN(t)?s._upcomingSlide(t-1):s._upcomingSlide(t),i>=0&&i!==s.current&&s.animate(i)}),s.pagination._events(),s.start(),s},h={containers:function(){s.init?(s.$el.css({height:s.height}),s.$control.css({width:s.width*a,left:-s.width}),s.$container.css({})):(t("body").css({margin:0}),s.$el.css({position:"relative",overflow:"hidden",width:"100%",height:s.height}),s.$control.css({position:"relative",transform:"translate3d(0)",height:"100%",width:s.width*a,left:-s.width}),s.$container.css({display:"none",margin:"0",padding:"0",listStyle:"none",position:"relative",height:"100%"})),1===s.size()&&s.$el.find(s.options.elements.nav).hide()},images:function(){var i=s.$container.find("img").not(s.options.elements.preserve);i.removeAttr("width").removeAttr("height").css({"-webkit-backface-visibility":"hidden","-ms-interpolation-mode":"bicubic",position:"absolute",left:"0",top:"0","z-index":"-1","max-width":"none"}),i.each(function(){var i=s.image._aspectRatio(this),n=this;if(t.data(this,"processed"))s.image._scale(n,i),s.image._center(n,i);else{var e=new Image;e.onload=function(){s.image._scale(n,i),s.image._center(n,i),t.data(n,"processed",!0)},e.src=this.src}})},children:function(){var i=s.$container.children();i.is("img")&&(i.each(function(){if(t(this).is("img")){t(this).wrap("<div>");var i=t(this).attr("id");t(this).removeAttr("id"),t(this).parent().attr("id",i)}}),i=s.$container.children()),s.init||i.css({display:"none",left:2*s.width}),i.css({position:"absolute",overflow:"hidden",height:"100%",width:s.width,top:0,zIndex:0})}},c={slide:function(i,t){var n=s.$container.children(),e=n.eq(i.upcoming_slide);e.css({left:i.upcoming_position,display:"block"}),s.$control.animate({left:i.offset},s.options.animation_speed,s.options.animation_easing,function(){s.size()>1&&(s.$control.css({left:-s.width}),n.eq(i.upcoming_slide).css({left:s.width,zIndex:2}),i.outgoing_slide>=0&&n.eq(i.outgoing_slide).css({left:s.width,display:"none",zIndex:0})),t()})},fade:function(i,t){var n=this,e=n.$container.children(),s=e.eq(i.outgoing_slide),o=e.eq(i.upcoming_slide);o.css({left:this.width,opacity:1,display:"block"}),i.outgoing_slide>=0?s.animate({opacity:0},n.options.animation_speed,n.options.animation_easing,function(){n.size()>1&&(e.eq(i.upcoming_slide).css({zIndex:2}),i.outgoing_slide>=0&&e.eq(i.outgoing_slide).css({opacity:1,display:"none",zIndex:0})),t()}):(o.css({zIndex:2}),t())}};c=t.extend(c,t.fn.superslides.fx);var d={_centerY:function(i){var n=t(i);n.css({top:(s.height-n.height())/2})},_centerX:function(i){var n=t(i);n.css({left:(s.width-n.width())/2})},_center:function(i){s.image._centerX(i),s.image._centerY(i)},_aspectRatio:function(i){if(!i.naturalHeight&&!i.naturalWidth){var t=new Image;t.src=i.src,i.naturalHeight=t.height,i.naturalWidth=t.width}return i.naturalHeight/i.naturalWidth},_scale:function(i,n){n=n||s.image._aspectRatio(i);var e=s.height/s.width,o=t(i);e>n?o.css({height:s.height,width:s.height/n}):o.css({height:s.width*n,width:s.width})}},l={_setCurrent:function(i){if(s.$pagination){var t=s.$pagination.children();t.removeClass("current"),t.eq(i).addClass("current")}},_addItem:function(i){var n=i+1,e=n,o=s.$container.children().eq(i),a=o.attr("id");a&&(e=a);var r=t("<a>",{href:"#"+e,text:e});r.appendTo(s.$pagination)},_setup:function(){if(s.options.pagination&&1!==s.size()){var i=t("<nav>",{"class":s.options.elements.pagination.replace(/^\./,"")});s.$pagination=i.appendTo(s.$el);for(var n=0;s.size()>n;n++)s.pagination._addItem(n)}},_events:function(){s.$el.on("click",s.options.elements.pagination+" a",function(i){i.preventDefault();var t=s._parseHash(this.hash),n=s._upcomingSlide(t-1);n!==s.current&&s.animate(n,function(){s.start()})})}};return this.css=h,this.image=d,this.pagination=l,this.fx=c,this.animation=this.fx[this.options.animation],this.$control=this.$container.wrap(o).parent(".slides-control"),s._findPositions(),s.width=s._findWidth(),s.height=s._findHeight(),this.css.children(),this.css.containers(),this.css.images(),this.pagination._setup(),r()},n.prototype={_findWidth:function(){return t(this.options.inherit_width_from).width()},_findHeight:function(){return t(this.options.inherit_height_from).height()},_findMultiplier:function(){return 1===this.size()?1:3},_upcomingSlide:function(i){if(/next/.test(i))return this._nextInDom();if(/prev/.test(i))return this._prevInDom();if(/\d/.test(i))return+i;if(i&&/\w/.test(i)){var t=this._findSlideById(i);return t>=0?t:0}return 0},_findSlideById:function(i){return this.$container.find("#"+i).index()},_findPositions:function(i,t){t=t||this,void 0===i&&(i=-1),t.current=i,t.next=t._nextInDom(),t.prev=t._prevInDom()},_nextInDom:function(){var i=this.current+1;return i===this.size()&&(i=0),i},_prevInDom:function(){var i=this.current-1;return 0>i&&(i=this.size()-1),i},_parseHash:function(t){return t=t||i.location.hash,t=t.replace(/^#/,""),t&&!isNaN(+t)&&(t=+t),t},size:function(){return this.$container.children().length},destroy:function(){return this.$el.removeData()},update:function(){this.css.children(),this.css.containers(),this.css.images(),this.pagination._addItem(this.size()),this._findPositions(this.current),this.$el.trigger("updated.slides")},stop:function(){clearInterval(this.play_id),delete this.play_id,this.$el.trigger("stopped.slides")},start:function(){var n=this;n.options.hashchange?t(i).trigger("hashchange"):this.animate(),this.options.play&&(this.play_id&&this.stop(),this.play_id=setInterval(function(){n.animate()},this.options.play)),this.$el.trigger("started.slides")},animate:function(t,n){var e=this,s={};if(!(this.animating||(this.animating=!0,void 0===t&&(t="next"),s.upcoming_slide=this._upcomingSlide(t),s.upcoming_slide>=this.size()))){if(s.outgoing_slide=this.current,s.upcoming_position=2*this.width,s.offset=-s.upcoming_position,("prev"===t||s.outgoing_slide>t)&&(s.upcoming_position=0,s.offset=0),e.size()>1&&e.pagination._setCurrent(s.upcoming_slide),e.options.hashchange){var o=s.upcoming_slide+1,a=e.$container.children(":eq("+s.upcoming_slide+")").attr("id");i.location.hash=a?a:o}e.$el.trigger("animating.slides",[s]),e.animation(s,function(){e._findPositions(s.upcoming_slide,e),"function"==typeof n&&n(),e.animating=!1,e.$el.trigger("animated.slides"),e.init||(e.$el.trigger("init.slides"),e.init=!0,e.$container.fadeIn("fast"))})}}},t.fn[e]=function(i,s){var o=[];return this.each(function(){var a,r,h;return a=t(this),r=a.data(e),h="object"==typeof i&&i,r||(o=a.data(e,r=new n(this,h))),"string"==typeof i&&(o=r[i],"function"==typeof o)?o=o.call(r,s):void 0}),o},t.fn[e].fx={}})(this,jQuery);
!function(a,b,c,d){function e(b,c){this.settings=null,this.options=a.extend({},e.Defaults,c),this.$element=a(b),this.drag=a.extend({},m),this.state=a.extend({},n),this.e=a.extend({},o),this._plugins={},this._supress={},this._current=null,this._speed=null,this._coordinates=[],this._breakpoint=null,this._width=null,this._items=[],this._clones=[],this._mergers=[],this._invalidated={},this._pipe=[],a.each(e.Plugins,a.proxy(function(a,b){this._plugins[a[0].toLowerCase()+a.slice(1)]=new b(this)},this)),a.each(e.Pipe,a.proxy(function(b,c){this._pipe.push({filter:c.filter,run:a.proxy(c.run,this)})},this)),this.setup(),this.initialize()}function f(a){if(a.touches!==d)return{x:a.touches[0].pageX,y:a.touches[0].pageY};if(a.touches===d){if(a.pageX!==d)return{x:a.pageX,y:a.pageY};if(a.pageX===d)return{x:a.clientX,y:a.clientY}}}function g(a){var b,d,e=c.createElement("div"),f=a;for(b in f)if(d=f[b],"undefined"!=typeof e.style[d])return e=null,[d,b];return[!1]}function h(){return g(["transition","WebkitTransition","MozTransition","OTransition"])[1]}function i(){return g(["transform","WebkitTransform","MozTransform","OTransform","msTransform"])[0]}function j(){return g(["perspective","webkitPerspective","MozPerspective","OPerspective","MsPerspective"])[0]}function k(){return"ontouchstart"in b||!!navigator.msMaxTouchPoints}function l(){return b.navigator.msPointerEnabled}var m,n,o;m={start:0,startX:0,startY:0,current:0,currentX:0,currentY:0,offsetX:0,offsetY:0,distance:null,startTime:0,endTime:0,updatedX:0,targetEl:null},n={isTouch:!1,isScrolling:!1,isSwiping:!1,direction:!1,inMotion:!1},o={_onDragStart:null,_onDragMove:null,_onDragEnd:null,_transitionEnd:null,_resizer:null,_responsiveCall:null,_goToLoop:null,_checkVisibile:null},e.Defaults={items:3,loop:!1,center:!1,mouseDrag:!0,touchDrag:!0,pullDrag:!0,freeDrag:!1,margin:0,stagePadding:0,merge:!1,mergeFit:!0,autoWidth:!1,startPosition:0,rtl:!1,smartSpeed:250,fluidSpeed:!1,dragEndSpeed:!1,responsive:{},responsiveRefreshRate:200,responsiveBaseElement:b,responsiveClass:!1,fallbackEasing:"swing",info:!1,nestedItemSelector:!1,itemElement:"div",stageElement:"div",themeClass:"owl-theme",baseClass:"owl-carousel",itemClass:"owl-item",centerClass:"center",activeClass:"active"},e.Width={Default:"default",Inner:"inner",Outer:"outer"},e.Plugins={},e.Pipe=[{filter:["width","items","settings"],run:function(a){a.current=this._items&&this._items[this.relative(this._current)]}},{filter:["items","settings"],run:function(){var a=this._clones,b=this.$stage.children(".cloned");(b.length!==a.length||!this.settings.loop&&a.length>0)&&(this.$stage.children(".cloned").remove(),this._clones=[])}},{filter:["items","settings"],run:function(){var a,b,c=this._clones,d=this._items,e=this.settings.loop?c.length-Math.max(2*this.settings.items,4):0;for(a=0,b=Math.abs(e/2);b>a;a++)e>0?(this.$stage.children().eq(d.length+c.length-1).remove(),c.pop(),this.$stage.children().eq(0).remove(),c.pop()):(c.push(c.length/2),this.$stage.append(d[c[c.length-1]].clone().addClass("cloned")),c.push(d.length-1-(c.length-1)/2),this.$stage.prepend(d[c[c.length-1]].clone().addClass("cloned")))}},{filter:["width","items","settings"],run:function(){var a,b,c,d=this.settings.rtl?1:-1,e=(this.width()/this.settings.items).toFixed(3),f=0;for(this._coordinates=[],b=0,c=this._clones.length+this._items.length;c>b;b++)a=this._mergers[this.relative(b)],a=this.settings.mergeFit&&Math.min(a,this.settings.items)||a,f+=(this.settings.autoWidth?this._items[this.relative(b)].width()+this.settings.margin:e*a)*d,this._coordinates.push(f)}},{filter:["width","items","settings"],run:function(){var b,c,d=(this.width()/this.settings.items).toFixed(3),e={width:Math.abs(this._coordinates[this._coordinates.length-1])+2*this.settings.stagePadding,"padding-left":this.settings.stagePadding||"","padding-right":this.settings.stagePadding||""};if(this.$stage.css(e),e={width:this.settings.autoWidth?"auto":d-this.settings.margin},e[this.settings.rtl?"margin-left":"margin-right"]=this.settings.margin,!this.settings.autoWidth&&a.grep(this._mergers,function(a){return a>1}).length>0)for(b=0,c=this._coordinates.length;c>b;b++)e.width=Math.abs(this._coordinates[b])-Math.abs(this._coordinates[b-1]||0)-this.settings.margin,this.$stage.children().eq(b).css(e);else this.$stage.children().css(e)}},{filter:["width","items","settings"],run:function(a){a.current&&this.reset(this.$stage.children().index(a.current))}},{filter:["position"],run:function(){this.animate(this.coordinates(this._current))}},{filter:["width","position","items","settings"],run:function(){var a,b,c,d,e=this.settings.rtl?1:-1,f=2*this.settings.stagePadding,g=this.coordinates(this.current())+f,h=g+this.width()*e,i=[];for(c=0,d=this._coordinates.length;d>c;c++)a=this._coordinates[c-1]||0,b=Math.abs(this._coordinates[c])+f*e,(this.op(a,"<=",g)&&this.op(a,">",h)||this.op(b,"<",g)&&this.op(b,">",h))&&i.push(c);this.$stage.children("."+this.settings.activeClass).removeClass(this.settings.activeClass),this.$stage.children(":eq("+i.join("), :eq(")+")").addClass(this.settings.activeClass),this.settings.center&&(this.$stage.children("."+this.settings.centerClass).removeClass(this.settings.centerClass),this.$stage.children().eq(this.current()).addClass(this.settings.centerClass))}}],e.prototype.initialize=function(){if(this.trigger("initialize"),this.$element.addClass(this.settings.baseClass).addClass(this.settings.themeClass).toggleClass("owl-rtl",this.settings.rtl),this.browserSupport(),this.settings.autoWidth&&this.state.imagesLoaded!==!0){var b,c,e;if(b=this.$element.find("img"),c=this.settings.nestedItemSelector?"."+this.settings.nestedItemSelector:d,e=this.$element.children(c).width(),b.length&&0>=e)return this.preloadAutoWidthImages(b),!1}this.$element.addClass("owl-loading"),this.$stage=a("<"+this.settings.stageElement+' class="owl-stage"/>').wrap('<div class="owl-stage-outer">'),this.$element.append(this.$stage.parent()),this.replace(this.$element.children().not(this.$stage.parent())),this._width=this.$element.width(),this.refresh(),this.$element.removeClass("owl-loading").addClass("owl-loaded"),this.eventsCall(),this.internalEvents(),this.addTriggerableEvents(),this.trigger("initialized")},e.prototype.setup=function(){var b=this.viewport(),c=this.options.responsive,d=-1,e=null;c?(a.each(c,function(a){b>=a&&a>d&&(d=Number(a))}),e=a.extend({},this.options,c[d]),delete e.responsive,e.responsiveClass&&this.$element.attr("class",function(a,b){return b.replace(/\b owl-responsive-\S+/g,"")}).addClass("owl-responsive-"+d)):e=a.extend({},this.options),(null===this.settings||this._breakpoint!==d)&&(this.trigger("change",{property:{name:"settings",value:e}}),this._breakpoint=d,this.settings=e,this.invalidate("settings"),this.trigger("changed",{property:{name:"settings",value:this.settings}}))},e.prototype.optionsLogic=function(){this.$element.toggleClass("owl-center",this.settings.center),this.settings.loop&&this._items.length<this.settings.items&&(this.settings.loop=!1),this.settings.autoWidth&&(this.settings.stagePadding=!1,this.settings.merge=!1)},e.prototype.prepare=function(b){var c=this.trigger("prepare",{content:b});return c.data||(c.data=a("<"+this.settings.itemElement+"/>").addClass(this.settings.itemClass).append(b)),this.trigger("prepared",{content:c.data}),c.data},e.prototype.update=function(){for(var b=0,c=this._pipe.length,d=a.proxy(function(a){return this[a]},this._invalidated),e={};c>b;)(this._invalidated.all||a.grep(this._pipe[b].filter,d).length>0)&&this._pipe[b].run(e),b++;this._invalidated={}},e.prototype.width=function(a){switch(a=a||e.Width.Default){case e.Width.Inner:case e.Width.Outer:return this._width;default:return this._width-2*this.settings.stagePadding+this.settings.margin}},e.prototype.refresh=function(){if(0===this._items.length)return!1;(new Date).getTime();this.trigger("refresh"),this.setup(),this.optionsLogic(),this.$stage.addClass("owl-refresh"),this.update(),this.$stage.removeClass("owl-refresh"),this.state.orientation=b.orientation,this.watchVisibility(),this.trigger("refreshed")},e.prototype.eventsCall=function(){this.e._onDragStart=a.proxy(function(a){this.onDragStart(a)},this),this.e._onDragMove=a.proxy(function(a){this.onDragMove(a)},this),this.e._onDragEnd=a.proxy(function(a){this.onDragEnd(a)},this),this.e._onResize=a.proxy(function(a){this.onResize(a)},this),this.e._transitionEnd=a.proxy(function(a){this.transitionEnd(a)},this),this.e._preventClick=a.proxy(function(a){this.preventClick(a)},this)},e.prototype.onThrottledResize=function(){b.clearTimeout(this.resizeTimer),this.resizeTimer=b.setTimeout(this.e._onResize,this.settings.responsiveRefreshRate)},e.prototype.onResize=function(){return this._items.length?this._width===this.$element.width()?!1:this.trigger("resize").isDefaultPrevented()?!1:(this._width=this.$element.width(),this.invalidate("width"),this.refresh(),void this.trigger("resized")):!1},e.prototype.eventsRouter=function(a){var b=a.type;"mousedown"===b||"touchstart"===b?this.onDragStart(a):"mousemove"===b||"touchmove"===b?this.onDragMove(a):"mouseup"===b||"touchend"===b?this.onDragEnd(a):"touchcancel"===b&&this.onDragEnd(a)},e.prototype.internalEvents=function(){var c=(k(),l());this.settings.mouseDrag?(this.$stage.on("mousedown",a.proxy(function(a){this.eventsRouter(a)},this)),this.$stage.on("dragstart",function(){return!1}),this.$stage.get(0).onselectstart=function(){return!1}):this.$element.addClass("owl-text-select-on"),this.settings.touchDrag&&!c&&this.$stage.on("touchstart touchcancel",a.proxy(function(a){this.eventsRouter(a)},this)),this.transitionEndVendor&&this.on(this.$stage.get(0),this.transitionEndVendor,this.e._transitionEnd,!1),this.settings.responsive!==!1&&this.on(b,"resize",a.proxy(this.onThrottledResize,this))},e.prototype.onDragStart=function(d){var e,g,h,i;if(e=d.originalEvent||d||b.event,3===e.which||this.state.isTouch)return!1;if("mousedown"===e.type&&this.$stage.addClass("owl-grab"),this.trigger("drag"),this.drag.startTime=(new Date).getTime(),this.speed(0),this.state.isTouch=!0,this.state.isScrolling=!1,this.state.isSwiping=!1,this.drag.distance=0,g=f(e).x,h=f(e).y,this.drag.offsetX=this.$stage.position().left,this.drag.offsetY=this.$stage.position().top,this.settings.rtl&&(this.drag.offsetX=this.$stage.position().left+this.$stage.width()-this.width()+this.settings.margin),this.state.inMotion&&this.support3d)i=this.getTransformProperty(),this.drag.offsetX=i,this.animate(i),this.state.inMotion=!0;else if(this.state.inMotion&&!this.support3d)return this.state.inMotion=!1,!1;this.drag.startX=g-this.drag.offsetX,this.drag.startY=h-this.drag.offsetY,this.drag.start=g-this.drag.startX,this.drag.targetEl=e.target||e.srcElement,this.drag.updatedX=this.drag.start,("IMG"===this.drag.targetEl.tagName||"A"===this.drag.targetEl.tagName)&&(this.drag.targetEl.draggable=!1),a(c).on("mousemove.owl.dragEvents mouseup.owl.dragEvents touchmove.owl.dragEvents touchend.owl.dragEvents",a.proxy(function(a){this.eventsRouter(a)},this))},e.prototype.onDragMove=function(a){var c,e,g,h,i,j;this.state.isTouch&&(this.state.isScrolling||(c=a.originalEvent||a||b.event,e=f(c).x,g=f(c).y,this.drag.currentX=e-this.drag.startX,this.drag.currentY=g-this.drag.startY,this.drag.distance=this.drag.currentX-this.drag.offsetX,this.drag.distance<0?this.state.direction=this.settings.rtl?"right":"left":this.drag.distance>0&&(this.state.direction=this.settings.rtl?"left":"right"),this.settings.loop?this.op(this.drag.currentX,">",this.coordinates(this.minimum()))&&"right"===this.state.direction?this.drag.currentX-=(this.settings.center&&this.coordinates(0))-this.coordinates(this._items.length):this.op(this.drag.currentX,"<",this.coordinates(this.maximum()))&&"left"===this.state.direction&&(this.drag.currentX+=(this.settings.center&&this.coordinates(0))-this.coordinates(this._items.length)):(h=this.coordinates(this.settings.rtl?this.maximum():this.minimum()),i=this.coordinates(this.settings.rtl?this.minimum():this.maximum()),j=this.settings.pullDrag?this.drag.distance/5:0,this.drag.currentX=Math.max(Math.min(this.drag.currentX,h+j),i+j)),(this.drag.distance>8||this.drag.distance<-8)&&(c.preventDefault!==d?c.preventDefault():c.returnValue=!1,this.state.isSwiping=!0),this.drag.updatedX=this.drag.currentX,(this.drag.currentY>16||this.drag.currentY<-16)&&this.state.isSwiping===!1&&(this.state.isScrolling=!0,this.drag.updatedX=this.drag.start),this.animate(this.drag.updatedX)))},e.prototype.onDragEnd=function(b){var d,e,f;if(this.state.isTouch){if("mouseup"===b.type&&this.$stage.removeClass("owl-grab"),this.trigger("dragged"),this.drag.targetEl.removeAttribute("draggable"),this.state.isTouch=!1,this.state.isScrolling=!1,this.state.isSwiping=!1,0===this.drag.distance&&this.state.inMotion!==!0)return this.state.inMotion=!1,!1;this.drag.endTime=(new Date).getTime(),d=this.drag.endTime-this.drag.startTime,e=Math.abs(this.drag.distance),(e>3||d>300)&&this.removeClick(this.drag.targetEl),f=this.closest(this.drag.updatedX),this.speed(this.settings.dragEndSpeed||this.settings.smartSpeed),this.current(f),this.invalidate("position"),this.update(),this.settings.pullDrag||this.drag.updatedX!==this.coordinates(f)||this.transitionEnd(),this.drag.distance=0,a(c).off(".owl.dragEvents")}},e.prototype.removeClick=function(c){this.drag.targetEl=c,a(c).on("click.preventClick",this.e._preventClick),b.setTimeout(function(){a(c).off("click.preventClick")},300)},e.prototype.preventClick=function(b){b.preventDefault?b.preventDefault():b.returnValue=!1,b.stopPropagation&&b.stopPropagation(),a(b.target).off("click.preventClick")},e.prototype.getTransformProperty=function(){var a,c;return a=b.getComputedStyle(this.$stage.get(0),null).getPropertyValue(this.vendorName+"transform"),a=a.replace(/matrix(3d)?\(|\)/g,"").split(","),c=16===a.length,c!==!0?a[4]:a[12]},e.prototype.closest=function(b){var c=-1,d=30,e=this.width(),f=this.coordinates();return this.settings.freeDrag||a.each(f,a.proxy(function(a,g){return b>g-d&&g+d>b?c=a:this.op(b,"<",g)&&this.op(b,">",f[a+1]||g-e)&&(c="left"===this.state.direction?a+1:a),-1===c},this)),this.settings.loop||(this.op(b,">",f[this.minimum()])?c=b=this.minimum():this.op(b,"<",f[this.maximum()])&&(c=b=this.maximum())),c},e.prototype.animate=function(b){this.trigger("translate"),this.state.inMotion=this.speed()>0,this.support3d?this.$stage.css({transform:"translate3d("+b+"px,0px, 0px)",transition:this.speed()/1e3+"s"}):this.state.isTouch?this.$stage.css({left:b+"px"}):this.$stage.animate({left:b},this.speed()/1e3,this.settings.fallbackEasing,a.proxy(function(){this.state.inMotion&&this.transitionEnd()},this))},e.prototype.current=function(a){if(a===d)return this._current;if(0===this._items.length)return d;if(a=this.normalize(a),this._current!==a){var b=this.trigger("change",{property:{name:"position",value:a}});b.data!==d&&(a=this.normalize(b.data)),this._current=a,this.invalidate("position"),this.trigger("changed",{property:{name:"position",value:this._current}})}return this._current},e.prototype.invalidate=function(a){this._invalidated[a]=!0},e.prototype.reset=function(a){a=this.normalize(a),a!==d&&(this._speed=0,this._current=a,this.suppress(["translate","translated"]),this.animate(this.coordinates(a)),this.release(["translate","translated"]))},e.prototype.normalize=function(b,c){var e=c?this._items.length:this._items.length+this._clones.length;return!a.isNumeric(b)||1>e?d:b=this._clones.length?(b%e+e)%e:Math.max(this.minimum(c),Math.min(this.maximum(c),b))},e.prototype.relative=function(a){return a=this.normalize(a),a-=this._clones.length/2,this.normalize(a,!0)},e.prototype.maximum=function(a){var b,c,d,e=0,f=this.settings;if(a)return this._items.length-1;if(!f.loop&&f.center)b=this._items.length-1;else if(f.loop||f.center)if(f.loop||f.center)b=this._items.length+f.items;else{if(!f.autoWidth&&!f.merge)throw"Can not detect maximum absolute position.";for(revert=f.rtl?1:-1,c=this.$stage.width()-this.$element.width();(d=this.coordinates(e))&&!(d*revert>=c);)b=++e}else b=this._items.length-f.items;return b},e.prototype.minimum=function(a){return a?0:this._clones.length/2},e.prototype.items=function(a){return a===d?this._items.slice():(a=this.normalize(a,!0),this._items[a])},e.prototype.mergers=function(a){return a===d?this._mergers.slice():(a=this.normalize(a,!0),this._mergers[a])},e.prototype.clones=function(b){var c=this._clones.length/2,e=c+this._items.length,f=function(a){return a%2===0?e+a/2:c-(a+1)/2};return b===d?a.map(this._clones,function(a,b){return f(b)}):a.map(this._clones,function(a,c){return a===b?f(c):null})},e.prototype.speed=function(a){return a!==d&&(this._speed=a),this._speed},e.prototype.coordinates=function(b){var c=null;return b===d?a.map(this._coordinates,a.proxy(function(a,b){return this.coordinates(b)},this)):(this.settings.center?(c=this._coordinates[b],c+=(this.width()-c+(this._coordinates[b-1]||0))/2*(this.settings.rtl?-1:1)):c=this._coordinates[b-1]||0,c)},e.prototype.duration=function(a,b,c){return Math.min(Math.max(Math.abs(b-a),1),6)*Math.abs(c||this.settings.smartSpeed)},e.prototype.to=function(c,d){if(this.settings.loop){var e=c-this.relative(this.current()),f=this.current(),g=this.current(),h=this.current()+e,i=0>g-h?!0:!1,j=this._clones.length+this._items.length;h<this.settings.items&&i===!1?(f=g+this._items.length,this.reset(f)):h>=j-this.settings.items&&i===!0&&(f=g-this._items.length,this.reset(f)),b.clearTimeout(this.e._goToLoop),this.e._goToLoop=b.setTimeout(a.proxy(function(){this.speed(this.duration(this.current(),f+e,d)),this.current(f+e),this.update()},this),30)}else this.speed(this.duration(this.current(),c,d)),this.current(c),this.update()},e.prototype.next=function(a){a=a||!1,this.to(this.relative(this.current())+1,a)},e.prototype.prev=function(a){a=a||!1,this.to(this.relative(this.current())-1,a)},e.prototype.transitionEnd=function(a){return a!==d&&(a.stopPropagation(),(a.target||a.srcElement||a.originalTarget)!==this.$stage.get(0))?!1:(this.state.inMotion=!1,void this.trigger("translated"))},e.prototype.viewport=function(){var d;if(this.options.responsiveBaseElement!==b)d=a(this.options.responsiveBaseElement).width();else if(b.innerWidth)d=b.innerWidth;else{if(!c.documentElement||!c.documentElement.clientWidth)throw"Can not detect viewport width.";d=c.documentElement.clientWidth}return d},e.prototype.replace=function(b){this.$stage.empty(),this._items=[],b&&(b=b instanceof jQuery?b:a(b)),this.settings.nestedItemSelector&&(b=b.find("."+this.settings.nestedItemSelector)),b.filter(function(){return 1===this.nodeType}).each(a.proxy(function(a,b){b=this.prepare(b),this.$stage.append(b),this._items.push(b),this._mergers.push(1*b.find("[data-merge]").andSelf("[data-merge]").attr("data-merge")||1)},this)),this.reset(a.isNumeric(this.settings.startPosition)?this.settings.startPosition:0),this.invalidate("items")},e.prototype.add=function(a,b){b=b===d?this._items.length:this.normalize(b,!0),this.trigger("add",{content:a,position:b}),0===this._items.length||b===this._items.length?(this.$stage.append(a),this._items.push(a),this._mergers.push(1*a.find("[data-merge]").andSelf("[data-merge]").attr("data-merge")||1)):(this._items[b].before(a),this._items.splice(b,0,a),this._mergers.splice(b,0,1*a.find("[data-merge]").andSelf("[data-merge]").attr("data-merge")||1)),this.invalidate("items"),this.trigger("added",{content:a,position:b})},e.prototype.remove=function(a){a=this.normalize(a,!0),a!==d&&(this.trigger("remove",{content:this._items[a],position:a}),this._items[a].remove(),this._items.splice(a,1),this._mergers.splice(a,1),this.invalidate("items"),this.trigger("removed",{content:null,position:a}))},e.prototype.addTriggerableEvents=function(){var b=a.proxy(function(b,c){return a.proxy(function(a){a.relatedTarget!==this&&(this.suppress([c]),b.apply(this,[].slice.call(arguments,1)),this.release([c]))},this)},this);a.each({next:this.next,prev:this.prev,to:this.to,destroy:this.destroy,refresh:this.refresh,replace:this.replace,add:this.add,remove:this.remove},a.proxy(function(a,c){this.$element.on(a+".owl.carousel",b(c,a+".owl.carousel"))},this))},e.prototype.watchVisibility=function(){function c(a){return a.offsetWidth>0&&a.offsetHeight>0}function d(){c(this.$element.get(0))&&(this.$element.removeClass("owl-hidden"),this.refresh(),b.clearInterval(this.e._checkVisibile))}c(this.$element.get(0))||(this.$element.addClass("owl-hidden"),b.clearInterval(this.e._checkVisibile),this.e._checkVisibile=b.setInterval(a.proxy(d,this),500))},e.prototype.preloadAutoWidthImages=function(b){var c,d,e,f;c=0,d=this,b.each(function(g,h){e=a(h),f=new Image,f.onload=function(){c++,e.attr("src",f.src),e.css("opacity",1),c>=b.length&&(d.state.imagesLoaded=!0,d.initialize())},f.src=e.attr("src")||e.attr("data-src")||e.attr("data-src-retina")})},e.prototype.destroy=function(){this.$element.hasClass(this.settings.themeClass)&&this.$element.removeClass(this.settings.themeClass),this.settings.responsive!==!1&&a(b).off("resize.owl.carousel"),this.transitionEndVendor&&this.off(this.$stage.get(0),this.transitionEndVendor,this.e._transitionEnd);for(var d in this._plugins)this._plugins[d].destroy();(this.settings.mouseDrag||this.settings.touchDrag)&&(this.$stage.off("mousedown touchstart touchcancel"),a(c).off(".owl.dragEvents"),this.$stage.get(0).onselectstart=function(){},this.$stage.off("dragstart",function(){return!1})),this.$element.off(".owl"),this.$stage.children(".cloned").remove(),this.e=null,this.$element.removeData("owlCarousel"),this.$stage.children().contents().unwrap(),this.$stage.children().unwrap(),this.$stage.unwrap()},e.prototype.op=function(a,b,c){var d=this.settings.rtl;switch(b){case"<":return d?a>c:c>a;case">":return d?c>a:a>c;case">=":return d?c>=a:a>=c;case"<=":return d?a>=c:c>=a}},e.prototype.on=function(a,b,c,d){a.addEventListener?a.addEventListener(b,c,d):a.attachEvent&&a.attachEvent("on"+b,c)},e.prototype.off=function(a,b,c,d){a.removeEventListener?a.removeEventListener(b,c,d):a.detachEvent&&a.detachEvent("on"+b,c)},e.prototype.trigger=function(b,c,d){var e={item:{count:this._items.length,index:this.current()}},f=a.camelCase(a.grep(["on",b,d],function(a){return a}).join("-").toLowerCase()),g=a.Event([b,"owl",d||"carousel"].join(".").toLowerCase(),a.extend({relatedTarget:this},e,c));return this._supress[b]||(a.each(this._plugins,function(a,b){b.onTrigger&&b.onTrigger(g)}),this.$element.trigger(g),this.settings&&"function"==typeof this.settings[f]&&this.settings[f].apply(this,g)),g},e.prototype.suppress=function(b){a.each(b,a.proxy(function(a,b){this._supress[b]=!0},this))},e.prototype.release=function(b){a.each(b,a.proxy(function(a,b){delete this._supress[b]},this))},e.prototype.browserSupport=function(){if(this.support3d=j(),this.support3d){this.transformVendor=i();var a=["transitionend","webkitTransitionEnd","transitionend","oTransitionEnd"];this.transitionEndVendor=a[h()],this.vendorName=this.transformVendor.replace(/Transform/i,""),this.vendorName=""!==this.vendorName?"-"+this.vendorName.toLowerCase()+"-":""}this.state.orientation=b.orientation},a.fn.owlCarousel=function(b){return this.each(function(){a(this).data("owlCarousel")||a(this).data("owlCarousel",new e(this,b))})},a.fn.owlCarousel.Constructor=e}(window.Zepto||window.jQuery,window,document),function(a,b){var c=function(b){this._core=b,this._loaded=[],this._handlers={"initialized.owl.carousel change.owl.carousel":a.proxy(function(b){if(b.namespace&&this._core.settings&&this._core.settings.lazyLoad&&(b.property&&"position"==b.property.name||"initialized"==b.type))for(var c=this._core.settings,d=c.center&&Math.ceil(c.items/2)||c.items,e=c.center&&-1*d||0,f=(b.property&&b.property.value||this._core.current())+e,g=this._core.clones().length,h=a.proxy(function(a,b){this.load(b)},this);e++<d;)this.load(g/2+this._core.relative(f)),g&&a.each(this._core.clones(this._core.relative(f++)),h)},this)},this._core.options=a.extend({},c.Defaults,this._core.options),this._core.$element.on(this._handlers)};c.Defaults={lazyLoad:!1},c.prototype.load=function(c){var d=this._core.$stage.children().eq(c),e=d&&d.find(".owl-lazy");!e||a.inArray(d.get(0),this._loaded)>-1||(e.each(a.proxy(function(c,d){var e,f=a(d),g=b.devicePixelRatio>1&&f.attr("data-src-retina")||f.attr("data-src");this._core.trigger("load",{element:f,url:g},"lazy"),f.is("img")?f.one("load.owl.lazy",a.proxy(function(){f.css("opacity",1),this._core.trigger("loaded",{element:f,url:g},"lazy")},this)).attr("src",g):(e=new Image,e.onload=a.proxy(function(){f.css({"background-image":"url("+g+")",opacity:"1"}),this._core.trigger("loaded",{element:f,url:g},"lazy")},this),e.src=g)},this)),this._loaded.push(d.get(0)))},c.prototype.destroy=function(){var a,b;for(a in this.handlers)this._core.$element.off(a,this.handlers[a]);for(b in Object.getOwnPropertyNames(this))"function"!=typeof this[b]&&(this[b]=null)},a.fn.owlCarousel.Constructor.Plugins.Lazy=c}(window.Zepto||window.jQuery,window,document),function(a){var b=function(c){this._core=c,this._handlers={"initialized.owl.carousel":a.proxy(function(){this._core.settings.autoHeight&&this.update()},this),"changed.owl.carousel":a.proxy(function(a){this._core.settings.autoHeight&&"position"==a.property.name&&this.update()},this),"loaded.owl.lazy":a.proxy(function(a){this._core.settings.autoHeight&&a.element.closest("."+this._core.settings.itemClass)===this._core.$stage.children().eq(this._core.current())&&this.update()},this)},this._core.options=a.extend({},b.Defaults,this._core.options),this._core.$element.on(this._handlers)};b.Defaults={autoHeight:!1,autoHeightClass:"owl-height"},b.prototype.update=function(){this._core.$stage.parent().height(this._core.$stage.children().eq(this._core.current()).height()).addClass(this._core.settings.autoHeightClass)},b.prototype.destroy=function(){var a,b;for(a in this._handlers)this._core.$element.off(a,this._handlers[a]);for(b in Object.getOwnPropertyNames(this))"function"!=typeof this[b]&&(this[b]=null)},a.fn.owlCarousel.Constructor.Plugins.AutoHeight=b}(window.Zepto||window.jQuery,window,document),function(a,b,c){var d=function(b){this._core=b,this._videos={},this._playing=null,this._fullscreen=!1,this._handlers={"resize.owl.carousel":a.proxy(function(a){this._core.settings.video&&!this.isInFullScreen()&&a.preventDefault()},this),"refresh.owl.carousel changed.owl.carousel":a.proxy(function(){this._playing&&this.stop()},this),"prepared.owl.carousel":a.proxy(function(b){var c=a(b.content).find(".owl-video");c.length&&(c.css("display","none"),this.fetch(c,a(b.content)))},this)},this._core.options=a.extend({},d.Defaults,this._core.options),this._core.$element.on(this._handlers),this._core.$element.on("click.owl.video",".owl-video-play-icon",a.proxy(function(a){this.play(a)},this))};d.Defaults={video:!1,videoHeight:!1,videoWidth:!1},d.prototype.fetch=function(a,b){var c=a.attr("data-vimeo-id")?"vimeo":"youtube",d=a.attr("data-vimeo-id")||a.attr("data-youtube-id"),e=a.attr("data-width")||this._core.settings.videoWidth,f=a.attr("data-height")||this._core.settings.videoHeight,g=a.attr("href");if(!g)throw new Error("Missing video URL.");if(d=g.match(/(http:|https:|)\/\/(player.|www.)?(vimeo\.com|youtu(be\.com|\.be|be\.googleapis\.com))\/(video\/|embed\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(\&\S+)?/),d[3].indexOf("youtu")>-1)c="youtube";else{if(!(d[3].indexOf("vimeo")>-1))throw new Error("Video URL not supported.");c="vimeo"}d=d[6],this._videos[g]={type:c,id:d,width:e,height:f},b.attr("data-video",g),this.thumbnail(a,this._videos[g])},d.prototype.thumbnail=function(b,c){var d,e,f,g=c.width&&c.height?'style="width:'+c.width+"px;height:"+c.height+'px;"':"",h=b.find("img"),i="src",j="",k=this._core.settings,l=function(a){e='<div class="owl-video-play-icon"></div>',d=k.lazyLoad?'<div class="owl-video-tn '+j+'" '+i+'="'+a+'"></div>':'<div class="owl-video-tn" style="opacity:1;background-image:url('+a+')"></div>',b.after(d),b.after(e)};return b.wrap('<div class="owl-video-wrapper"'+g+"></div>"),this._core.settings.lazyLoad&&(i="data-src",j="owl-lazy"),h.length?(l(h.attr(i)),h.remove(),!1):void("youtube"===c.type?(f="http://img.youtube.com/vi/"+c.id+"/hqdefault.jpg",l(f)):"vimeo"===c.type&&a.ajax({type:"GET",url:"http://vimeo.com/api/v2/video/"+c.id+".json",jsonp:"callback",dataType:"jsonp",success:function(a){f=a[0].thumbnail_large,l(f)}}))},d.prototype.stop=function(){this._core.trigger("stop",null,"video"),this._playing.find(".owl-video-frame").remove(),this._playing.removeClass("owl-video-playing"),this._playing=null},d.prototype.play=function(b){this._core.trigger("play",null,"video"),this._playing&&this.stop();var c,d,e=a(b.target||b.srcElement),f=e.closest("."+this._core.settings.itemClass),g=this._videos[f.attr("data-video")],h=g.width||"100%",i=g.height||this._core.$stage.height();"youtube"===g.type?c='<iframe width="'+h+'" height="'+i+'" src="http://www.youtube.com/embed/'+g.id+"?autoplay=1&v="+g.id+'" frameborder="0" allowfullscreen></iframe>':"vimeo"===g.type&&(c='<iframe src="http://player.vimeo.com/video/'+g.id+'?autoplay=1" width="'+h+'" height="'+i+'" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>'),f.addClass("owl-video-playing"),this._playing=f,d=a('<div style="height:'+i+"px; width:"+h+'px" class="owl-video-frame">'+c+"</div>"),e.after(d)},d.prototype.isInFullScreen=function(){var d=c.fullscreenElement||c.mozFullScreenElement||c.webkitFullscreenElement;return d&&a(d).parent().hasClass("owl-video-frame")&&(this._core.speed(0),this._fullscreen=!0),d&&this._fullscreen&&this._playing?!1:this._fullscreen?(this._fullscreen=!1,!1):this._playing&&this._core.state.orientation!==b.orientation?(this._core.state.orientation=b.orientation,!1):!0},d.prototype.destroy=function(){var a,b;this._core.$element.off("click.owl.video");for(a in this._handlers)this._core.$element.off(a,this._handlers[a]);for(b in Object.getOwnPropertyNames(this))"function"!=typeof this[b]&&(this[b]=null)},a.fn.owlCarousel.Constructor.Plugins.Video=d}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){var e=function(b){this.core=b,this.core.options=a.extend({},e.Defaults,this.core.options),this.swapping=!0,this.previous=d,this.next=d,this.handlers={"change.owl.carousel":a.proxy(function(a){"position"==a.property.name&&(this.previous=this.core.current(),this.next=a.property.value)},this),"drag.owl.carousel dragged.owl.carousel translated.owl.carousel":a.proxy(function(a){this.swapping="translated"==a.type},this),"translate.owl.carousel":a.proxy(function(){this.swapping&&(this.core.options.animateOut||this.core.options.animateIn)&&this.swap()},this)},this.core.$element.on(this.handlers)};e.Defaults={animateOut:!1,animateIn:!1},e.prototype.swap=function(){if(1===this.core.settings.items&&this.core.support3d){this.core.speed(0);var b,c=a.proxy(this.clear,this),d=this.core.$stage.children().eq(this.previous),e=this.core.$stage.children().eq(this.next),f=this.core.settings.animateIn,g=this.core.settings.animateOut;this.core.current()!==this.previous&&(g&&(b=this.core.coordinates(this.previous)-this.core.coordinates(this.next),d.css({left:b+"px"}).addClass("animated owl-animated-out").addClass(g).one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend",c)),f&&e.addClass("animated owl-animated-in").addClass(f).one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend",c))}},e.prototype.clear=function(b){a(b.target).css({left:""}).removeClass("animated owl-animated-out owl-animated-in").removeClass(this.core.settings.animateIn).removeClass(this.core.settings.animateOut),this.core.transitionEnd()},e.prototype.destroy=function(){var a,b;for(a in this.handlers)this.core.$element.off(a,this.handlers[a]);for(b in Object.getOwnPropertyNames(this))"function"!=typeof this[b]&&(this[b]=null)},a.fn.owlCarousel.Constructor.Plugins.Animate=e}(window.Zepto||window.jQuery,window,document),function(a,b,c){var d=function(b){this.core=b,this.core.options=a.extend({},d.Defaults,this.core.options),this.handlers={"translated.owl.carousel refreshed.owl.carousel":a.proxy(function(){this.autoplay()
},this),"play.owl.autoplay":a.proxy(function(a,b,c){this.play(b,c)},this),"stop.owl.autoplay":a.proxy(function(){this.stop()},this),"mouseover.owl.autoplay":a.proxy(function(){this.core.settings.autoplayHoverPause&&this.pause()},this),"mouseleave.owl.autoplay":a.proxy(function(){this.core.settings.autoplayHoverPause&&this.autoplay()},this)},this.core.$element.on(this.handlers)};d.Defaults={autoplay:!1,autoplayTimeout:5e3,autoplayHoverPause:!1,autoplaySpeed:!1},d.prototype.autoplay=function(){this.core.settings.autoplay&&!this.core.state.videoPlay?(b.clearInterval(this.interval),this.interval=b.setInterval(a.proxy(function(){this.play()},this),this.core.settings.autoplayTimeout)):b.clearInterval(this.interval)},d.prototype.play=function(){return c.hidden===!0||this.core.state.isTouch||this.core.state.isScrolling||this.core.state.isSwiping||this.core.state.inMotion?void 0:this.core.settings.autoplay===!1?void b.clearInterval(this.interval):void this.core.next(this.core.settings.autoplaySpeed)},d.prototype.stop=function(){b.clearInterval(this.interval)},d.prototype.pause=function(){b.clearInterval(this.interval)},d.prototype.destroy=function(){var a,c;b.clearInterval(this.interval);for(a in this.handlers)this.core.$element.off(a,this.handlers[a]);for(c in Object.getOwnPropertyNames(this))"function"!=typeof this[c]&&(this[c]=null)},a.fn.owlCarousel.Constructor.Plugins.autoplay=d}(window.Zepto||window.jQuery,window,document),function(a){"use strict";var b=function(c){this._core=c,this._initialized=!1,this._pages=[],this._controls={},this._templates=[],this.$element=this._core.$element,this._overrides={next:this._core.next,prev:this._core.prev,to:this._core.to},this._handlers={"prepared.owl.carousel":a.proxy(function(b){this._core.settings.dotsData&&this._templates.push(a(b.content).find("[data-dot]").andSelf("[data-dot]").attr("data-dot"))},this),"add.owl.carousel":a.proxy(function(b){this._core.settings.dotsData&&this._templates.splice(b.position,0,a(b.content).find("[data-dot]").andSelf("[data-dot]").attr("data-dot"))},this),"remove.owl.carousel prepared.owl.carousel":a.proxy(function(a){this._core.settings.dotsData&&this._templates.splice(a.position,1)},this),"change.owl.carousel":a.proxy(function(a){if("position"==a.property.name&&!this._core.state.revert&&!this._core.settings.loop&&this._core.settings.navRewind){var b=this._core.current(),c=this._core.maximum(),d=this._core.minimum();a.data=a.property.value>c?b>=c?d:c:a.property.value<d?c:a.property.value}},this),"changed.owl.carousel":a.proxy(function(a){"position"==a.property.name&&this.draw()},this),"refreshed.owl.carousel":a.proxy(function(){this._initialized||(this.initialize(),this._initialized=!0),this._core.trigger("refresh",null,"navigation"),this.update(),this.draw(),this._core.trigger("refreshed",null,"navigation")},this)},this._core.options=a.extend({},b.Defaults,this._core.options),this.$element.on(this._handlers)};b.Defaults={nav:!1,navRewind:!0,navText:["prev","next"],navSpeed:!1,navElement:"div",navContainer:!1,navContainerClass:"owl-nav",navClass:["owl-prev","owl-next"],slideBy:1,dotClass:"owl-dot",dotsClass:"owl-dots",dots:!0,dotsEach:!1,dotData:!1,dotsSpeed:!1,dotsContainer:!1,controlsClass:"owl-controls"},b.prototype.initialize=function(){var b,c,d=this._core.settings;d.dotsData||(this._templates=[a("<div>").addClass(d.dotClass).append(a("<span>")).prop("outerHTML")]),d.navContainer&&d.dotsContainer||(this._controls.$container=a("<div>").addClass(d.controlsClass).appendTo(this.$element)),this._controls.$indicators=d.dotsContainer?a(d.dotsContainer):a("<div>").hide().addClass(d.dotsClass).appendTo(this._controls.$container),this._controls.$indicators.on("click","div",a.proxy(function(b){var c=a(b.target).parent().is(this._controls.$indicators)?a(b.target).index():a(b.target).parent().index();b.preventDefault(),this.to(c,d.dotsSpeed)},this)),b=d.navContainer?a(d.navContainer):a("<div>").addClass(d.navContainerClass).prependTo(this._controls.$container),this._controls.$next=a("<"+d.navElement+">"),this._controls.$previous=this._controls.$next.clone(),this._controls.$previous.addClass(d.navClass[0]).html(d.navText[0]).hide().prependTo(b).on("click",a.proxy(function(){this.prev(d.navSpeed)},this)),this._controls.$next.addClass(d.navClass[1]).html(d.navText[1]).hide().appendTo(b).on("click",a.proxy(function(){this.next(d.navSpeed)},this));for(c in this._overrides)this._core[c]=a.proxy(this[c],this)},b.prototype.destroy=function(){var a,b,c,d;for(a in this._handlers)this.$element.off(a,this._handlers[a]);for(b in this._controls)this._controls[b].remove();for(d in this.overides)this._core[d]=this._overrides[d];for(c in Object.getOwnPropertyNames(this))"function"!=typeof this[c]&&(this[c]=null)},b.prototype.update=function(){var a,b,c,d=this._core.settings,e=this._core.clones().length/2,f=e+this._core.items().length,g=d.center||d.autoWidth||d.dotData?1:d.dotsEach||d.items;if("page"!==d.slideBy&&(d.slideBy=Math.min(d.slideBy,d.items)),d.dots||"page"==d.slideBy)for(this._pages=[],a=e,b=0,c=0;f>a;a++)(b>=g||0===b)&&(this._pages.push({start:a-e,end:a-e+g-1}),b=0,++c),b+=this._core.mergers(this._core.relative(a))},b.prototype.draw=function(){var b,c,d="",e=this._core.settings,f=(this._core.$stage.children(),this._core.relative(this._core.current()));if(!e.nav||e.loop||e.navRewind||(this._controls.$previous.toggleClass("disabled",0>=f),this._controls.$next.toggleClass("disabled",f>=this._core.maximum())),this._controls.$previous.toggle(e.nav),this._controls.$next.toggle(e.nav),e.dots){if(b=this._pages.length-this._controls.$indicators.children().length,e.dotData&&0!==b){for(c=0;c<this._controls.$indicators.children().length;c++)d+=this._templates[this._core.relative(c)];this._controls.$indicators.html(d)}else b>0?(d=new Array(b+1).join(this._templates[0]),this._controls.$indicators.append(d)):0>b&&this._controls.$indicators.children().slice(b).remove();this._controls.$indicators.find(".active").removeClass("active"),this._controls.$indicators.children().eq(a.inArray(this.current(),this._pages)).addClass("active")}this._controls.$indicators.toggle(e.dots)},b.prototype.onTrigger=function(b){var c=this._core.settings;b.page={index:a.inArray(this.current(),this._pages),count:this._pages.length,size:c&&(c.center||c.autoWidth||c.dotData?1:c.dotsEach||c.items)}},b.prototype.current=function(){var b=this._core.relative(this._core.current());return a.grep(this._pages,function(a){return a.start<=b&&a.end>=b}).pop()},b.prototype.getPosition=function(b){var c,d,e=this._core.settings;return"page"==e.slideBy?(c=a.inArray(this.current(),this._pages),d=this._pages.length,b?++c:--c,c=this._pages[(c%d+d)%d].start):(c=this._core.relative(this._core.current()),d=this._core.items().length,b?c+=e.slideBy:c-=e.slideBy),c},b.prototype.next=function(b){a.proxy(this._overrides.to,this._core)(this.getPosition(!0),b)},b.prototype.prev=function(b){a.proxy(this._overrides.to,this._core)(this.getPosition(!1),b)},b.prototype.to=function(b,c,d){var e;d?a.proxy(this._overrides.to,this._core)(b,c):(e=this._pages.length,a.proxy(this._overrides.to,this._core)(this._pages[(b%e+e)%e].start,c))},a.fn.owlCarousel.Constructor.Plugins.Navigation=b}(window.Zepto||window.jQuery,window,document),function(a,b){"use strict";var c=function(d){this._core=d,this._hashes={},this.$element=this._core.$element,this._handlers={"initialized.owl.carousel":a.proxy(function(){"URLHash"==this._core.settings.startPosition&&a(b).trigger("hashchange.owl.navigation")},this),"prepared.owl.carousel":a.proxy(function(b){var c=a(b.content).find("[data-hash]").andSelf("[data-hash]").attr("data-hash");this._hashes[c]=b.content},this)},this._core.options=a.extend({},c.Defaults,this._core.options),this.$element.on(this._handlers),a(b).on("hashchange.owl.navigation",a.proxy(function(){var a=b.location.hash.substring(1),c=this._core.$stage.children(),d=this._hashes[a]&&c.index(this._hashes[a])||0;return a?void this._core.to(d,!1,!0):!1},this))};c.Defaults={URLhashListener:!1},c.prototype.destroy=function(){var c,d;a(b).off("hashchange.owl.navigation");for(c in this._handlers)this._core.$element.off(c,this._handlers[c]);for(d in Object.getOwnPropertyNames(this))"function"!=typeof this[d]&&(this[d]=null)},a.fn.owlCarousel.Constructor.Plugins.Hash=c}(window.Zepto||window.jQuery,window,document);
/*! jCarousel - v0.3.1 - 2014-04-26
* http://sorgalla.com/jcarousel
* Copyright (c) 2014 Jan Sorgalla; Licensed MIT */

(function(t){"use strict";var i=t.jCarousel={};i.version="0.3.1";var s=/^([+\-]=)?(.+)$/;i.parseTarget=function(t){var i=!1,e="object"!=typeof t?s.exec(t):null;return e?(t=parseInt(e[2],10)||0,e[1]&&(i=!0,"-="===e[1]&&(t*=-1))):"object"!=typeof t&&(t=parseInt(t,10)||0),{target:t,relative:i}},i.detectCarousel=function(t){for(var i;t.length>0;){if(i=t.filter("[data-jcarousel]"),i.length>0)return i;if(i=t.find("[data-jcarousel]"),i.length>0)return i;t=t.parent()}return null},i.base=function(s){return{version:i.version,_options:{},_element:null,_carousel:null,_init:t.noop,_create:t.noop,_destroy:t.noop,_reload:t.noop,create:function(){return this._element.attr("data-"+s.toLowerCase(),!0).data(s,this),!1===this._trigger("create")?this:(this._create(),this._trigger("createend"),this)},destroy:function(){return!1===this._trigger("destroy")?this:(this._destroy(),this._trigger("destroyend"),this._element.removeData(s).removeAttr("data-"+s.toLowerCase()),this)},reload:function(t){return!1===this._trigger("reload")?this:(t&&this.options(t),this._reload(),this._trigger("reloadend"),this)},element:function(){return this._element},options:function(i,s){if(0===arguments.length)return t.extend({},this._options);if("string"==typeof i){if(s===void 0)return this._options[i]===void 0?null:this._options[i];this._options[i]=s}else this._options=t.extend({},this._options,i);return this},carousel:function(){return this._carousel||(this._carousel=i.detectCarousel(this.options("carousel")||this._element),this._carousel||t.error('Could not detect carousel for plugin "'+s+'"')),this._carousel},_trigger:function(i,e,r){var n,o=!1;return r=[this].concat(r||[]),(e||this._element).each(function(){n=t.Event((s+":"+i).toLowerCase()),t(this).trigger(n,r),n.isDefaultPrevented()&&(o=!0)}),!o}}},i.plugin=function(s,e){var r=t[s]=function(i,s){this._element=t(i),this.options(s),this._init(),this.create()};return r.fn=r.prototype=t.extend({},i.base(s),e),t.fn[s]=function(i){var e=Array.prototype.slice.call(arguments,1),n=this;return"string"==typeof i?this.each(function(){var r=t(this).data(s);if(!r)return t.error("Cannot call methods on "+s+" prior to initialization; "+'attempted to call method "'+i+'"');if(!t.isFunction(r[i])||"_"===i.charAt(0))return t.error('No such method "'+i+'" for '+s+" instance");var o=r[i].apply(r,e);return o!==r&&o!==void 0?(n=o,!1):void 0}):this.each(function(){var e=t(this).data(s);e instanceof r?e.reload(i):new r(this,i)}),n},r}})(jQuery),function(t,i){"use strict";var s=function(t){return parseFloat(t)||0};t.jCarousel.plugin("jcarousel",{animating:!1,tail:0,inTail:!1,resizeTimer:null,lt:null,vertical:!1,rtl:!1,circular:!1,underflow:!1,relative:!1,_options:{list:function(){return this.element().children().eq(0)},items:function(){return this.list().children()},animation:400,transitions:!1,wrap:null,vertical:null,rtl:null,center:!1},_list:null,_items:null,_target:null,_first:null,_last:null,_visible:null,_fullyvisible:null,_init:function(){var t=this;return this.onWindowResize=function(){t.resizeTimer&&clearTimeout(t.resizeTimer),t.resizeTimer=setTimeout(function(){t.reload()},100)},this},_create:function(){this._reload(),t(i).on("resize.jcarousel",this.onWindowResize)},_destroy:function(){t(i).off("resize.jcarousel",this.onWindowResize)},_reload:function(){this.vertical=this.options("vertical"),null==this.vertical&&(this.vertical=this.list().height()>this.list().width()),this.rtl=this.options("rtl"),null==this.rtl&&(this.rtl=function(i){if("rtl"===(""+i.attr("dir")).toLowerCase())return!0;var s=!1;return i.parents("[dir]").each(function(){return/rtl/i.test(t(this).attr("dir"))?(s=!0,!1):void 0}),s}(this._element)),this.lt=this.vertical?"top":"left",this.relative="relative"===this.list().css("position"),this._list=null,this._items=null;var i=this._target&&this.index(this._target)>=0?this._target:this.closest();this.circular="circular"===this.options("wrap"),this.underflow=!1;var s={left:0,top:0};return i.length>0&&(this._prepare(i),this.list().find("[data-jcarousel-clone]").remove(),this._items=null,this.underflow=this._fullyvisible.length>=this.items().length,this.circular=this.circular&&!this.underflow,s[this.lt]=this._position(i)+"px"),this.move(s),this},list:function(){if(null===this._list){var i=this.options("list");this._list=t.isFunction(i)?i.call(this):this._element.find(i)}return this._list},items:function(){if(null===this._items){var i=this.options("items");this._items=(t.isFunction(i)?i.call(this):this.list().find(i)).not("[data-jcarousel-clone]")}return this._items},index:function(t){return this.items().index(t)},closest:function(){var i,e=this,r=this.list().position()[this.lt],n=t(),o=!1,l=this.vertical?"bottom":this.rtl&&!this.relative?"left":"right";return this.rtl&&this.relative&&!this.vertical&&(r+=this.list().width()-this.clipping()),this.items().each(function(){if(n=t(this),o)return!1;var a=e.dimension(n);if(r+=a,r>=0){if(i=a-s(n.css("margin-"+l)),!(0>=Math.abs(r)-a+i/2))return!1;o=!0}}),n},target:function(){return this._target},first:function(){return this._first},last:function(){return this._last},visible:function(){return this._visible},fullyvisible:function(){return this._fullyvisible},hasNext:function(){if(!1===this._trigger("hasnext"))return!0;var t=this.options("wrap"),i=this.items().length-1;return i>=0&&!this.underflow&&(t&&"first"!==t||i>this.index(this._last)||this.tail&&!this.inTail)?!0:!1},hasPrev:function(){if(!1===this._trigger("hasprev"))return!0;var t=this.options("wrap");return this.items().length>0&&!this.underflow&&(t&&"last"!==t||this.index(this._first)>0||this.tail&&this.inTail)?!0:!1},clipping:function(){return this._element["inner"+(this.vertical?"Height":"Width")]()},dimension:function(t){return t["outer"+(this.vertical?"Height":"Width")](!0)},scroll:function(i,s,e){if(this.animating)return this;if(!1===this._trigger("scroll",null,[i,s]))return this;t.isFunction(s)&&(e=s,s=!0);var r=t.jCarousel.parseTarget(i);if(r.relative){var n,o,l,a,h,u,c,f,d=this.items().length-1,_=Math.abs(r.target),p=this.options("wrap");if(r.target>0){var g=this.index(this._last);if(g>=d&&this.tail)this.inTail?"both"===p||"last"===p?this._scroll(0,s,e):t.isFunction(e)&&e.call(this,!1):this._scrollTail(s,e);else if(n=this.index(this._target),this.underflow&&n===d&&("circular"===p||"both"===p||"last"===p)||!this.underflow&&g===d&&("both"===p||"last"===p))this._scroll(0,s,e);else if(l=n+_,this.circular&&l>d){for(f=d,h=this.items().get(-1);l>f++;)h=this.items().eq(0),u=this._visible.index(h)>=0,u&&h.after(h.clone(!0).attr("data-jcarousel-clone",!0)),this.list().append(h),u||(c={},c[this.lt]=this.dimension(h),this.moveBy(c)),this._items=null;this._scroll(h,s,e)}else this._scroll(Math.min(l,d),s,e)}else if(this.inTail)this._scroll(Math.max(this.index(this._first)-_+1,0),s,e);else if(o=this.index(this._first),n=this.index(this._target),a=this.underflow?n:o,l=a-_,0>=a&&(this.underflow&&"circular"===p||"both"===p||"first"===p))this._scroll(d,s,e);else if(this.circular&&0>l){for(f=l,h=this.items().get(0);0>f++;){h=this.items().eq(-1),u=this._visible.index(h)>=0,u&&h.after(h.clone(!0).attr("data-jcarousel-clone",!0)),this.list().prepend(h),this._items=null;var v=this.dimension(h);c={},c[this.lt]=-v,this.moveBy(c)}this._scroll(h,s,e)}else this._scroll(Math.max(l,0),s,e)}else this._scroll(r.target,s,e);return this._trigger("scrollend"),this},moveBy:function(t,i){var e=this.list().position(),r=1,n=0;return this.rtl&&!this.vertical&&(r=-1,this.relative&&(n=this.list().width()-this.clipping())),t.left&&(t.left=e.left+n+s(t.left)*r+"px"),t.top&&(t.top=e.top+n+s(t.top)*r+"px"),this.move(t,i)},move:function(i,s){s=s||{};var e=this.options("transitions"),r=!!e,n=!!e.transforms,o=!!e.transforms3d,l=s.duration||0,a=this.list();if(!r&&l>0)return a.animate(i,s),void 0;var h=s.complete||t.noop,u={};if(r){var c=a.css(["transitionDuration","transitionTimingFunction","transitionProperty"]),f=h;h=function(){t(this).css(c),f.call(this)},u={transitionDuration:(l>0?l/1e3:0)+"s",transitionTimingFunction:e.easing||s.easing,transitionProperty:l>0?function(){return n||o?"all":i.left?"left":"top"}():"none",transform:"none"}}o?u.transform="translate3d("+(i.left||0)+","+(i.top||0)+",0)":n?u.transform="translate("+(i.left||0)+","+(i.top||0)+")":t.extend(u,i),r&&l>0&&a.one("transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd",h),a.css(u),0>=l&&a.each(function(){h.call(this)})},_scroll:function(i,s,e){if(this.animating)return t.isFunction(e)&&e.call(this,!1),this;if("object"!=typeof i?i=this.items().eq(i):i.jquery===void 0&&(i=t(i)),0===i.length)return t.isFunction(e)&&e.call(this,!1),this;this.inTail=!1,this._prepare(i);var r=this._position(i),n=this.list().position()[this.lt];if(r===n)return t.isFunction(e)&&e.call(this,!1),this;var o={};return o[this.lt]=r+"px",this._animate(o,s,e),this},_scrollTail:function(i,s){if(this.animating||!this.tail)return t.isFunction(s)&&s.call(this,!1),this;var e=this.list().position()[this.lt];this.rtl&&this.relative&&!this.vertical&&(e+=this.list().width()-this.clipping()),this.rtl&&!this.vertical?e+=this.tail:e-=this.tail,this.inTail=!0;var r={};return r[this.lt]=e+"px",this._update({target:this._target.next(),fullyvisible:this._fullyvisible.slice(1).add(this._visible.last())}),this._animate(r,i,s),this},_animate:function(i,s,e){if(e=e||t.noop,!1===this._trigger("animate"))return e.call(this,!1),this;this.animating=!0;var r=this.options("animation"),n=t.proxy(function(){this.animating=!1;var t=this.list().find("[data-jcarousel-clone]");t.length>0&&(t.remove(),this._reload()),this._trigger("animateend"),e.call(this,!0)},this),o="object"==typeof r?t.extend({},r):{duration:r},l=o.complete||t.noop;return s===!1?o.duration=0:t.fx.speeds[o.duration]!==void 0&&(o.duration=t.fx.speeds[o.duration]),o.complete=function(){n(),l.call(this)},this.move(i,o),this},_prepare:function(i){var e,r,n,o,l=this.index(i),a=l,h=this.dimension(i),u=this.clipping(),c=this.vertical?"bottom":this.rtl?"left":"right",f=this.options("center"),d={target:i,first:i,last:i,visible:i,fullyvisible:u>=h?i:t()};if(f&&(h/=2,u/=2),u>h)for(;;){if(e=this.items().eq(++a),0===e.length){if(!this.circular)break;if(e=this.items().eq(0),i.get(0)===e.get(0))break;if(r=this._visible.index(e)>=0,r&&e.after(e.clone(!0).attr("data-jcarousel-clone",!0)),this.list().append(e),!r){var _={};_[this.lt]=this.dimension(e),this.moveBy(_)}this._items=null}if(o=this.dimension(e),0===o)break;if(h+=o,d.last=e,d.visible=d.visible.add(e),n=s(e.css("margin-"+c)),u>=h-n&&(d.fullyvisible=d.fullyvisible.add(e)),h>=u)break}if(!this.circular&&!f&&u>h)for(a=l;;){if(0>--a)break;if(e=this.items().eq(a),0===e.length)break;if(o=this.dimension(e),0===o)break;if(h+=o,d.first=e,d.visible=d.visible.add(e),n=s(e.css("margin-"+c)),u>=h-n&&(d.fullyvisible=d.fullyvisible.add(e)),h>=u)break}return this._update(d),this.tail=0,f||"circular"===this.options("wrap")||"custom"===this.options("wrap")||this.index(d.last)!==this.items().length-1||(h-=s(d.last.css("margin-"+c)),h>u&&(this.tail=h-u)),this},_position:function(t){var i=this._first,s=i.position()[this.lt],e=this.options("center"),r=e?this.clipping()/2-this.dimension(i)/2:0;return this.rtl&&!this.vertical?(s-=this.relative?this.list().width()-this.dimension(i):this.clipping()-this.dimension(i),s+=r):s-=r,!e&&(this.index(t)>this.index(i)||this.inTail)&&this.tail?(s=this.rtl&&!this.vertical?s-this.tail:s+this.tail,this.inTail=!0):this.inTail=!1,-s},_update:function(i){var s,e=this,r={target:this._target||t(),first:this._first||t(),last:this._last||t(),visible:this._visible||t(),fullyvisible:this._fullyvisible||t()},n=this.index(i.first||r.first)<this.index(r.first),o=function(s){var o=[],l=[];i[s].each(function(){0>r[s].index(this)&&o.push(this)}),r[s].each(function(){0>i[s].index(this)&&l.push(this)}),n?o=o.reverse():l=l.reverse(),e._trigger(s+"in",t(o)),e._trigger(s+"out",t(l)),e["_"+s]=i[s]};for(s in i)o(s);return this}})}(jQuery,window),function(t){"use strict";t.jcarousel.fn.scrollIntoView=function(i,s,e){var r,n=t.jCarousel.parseTarget(i),o=this.index(this._fullyvisible.first()),l=this.index(this._fullyvisible.last());if(r=n.relative?0>n.target?Math.max(0,o+n.target):l+n.target:"object"!=typeof n.target?n.target:this.index(n.target),o>r)return this.scroll(r,s,e);if(r>=o&&l>=r)return t.isFunction(e)&&e.call(this,!1),this;for(var a,h=this.items(),u=this.clipping(),c=this.vertical?"bottom":this.rtl?"left":"right",f=0;;){if(a=h.eq(r),0===a.length)break;if(f+=this.dimension(a),f>=u){var d=parseFloat(a.css("margin-"+c))||0;f-d!==u&&r++;break}if(0>=r)break;r--}return this.scroll(r,s,e)}}(jQuery),function(t){"use strict";t.jCarousel.plugin("jcarouselControl",{_options:{target:"+=1",event:"click",method:"scroll"},_active:null,_init:function(){this.onDestroy=t.proxy(function(){this._destroy(),this.carousel().one("jcarousel:createend",t.proxy(this._create,this))},this),this.onReload=t.proxy(this._reload,this),this.onEvent=t.proxy(function(i){i.preventDefault();var s=this.options("method");t.isFunction(s)?s.call(this):this.carousel().jcarousel(this.options("method"),this.options("target"))},this)},_create:function(){this.carousel().one("jcarousel:destroy",this.onDestroy).on("jcarousel:reloadend jcarousel:scrollend",this.onReload),this._element.on(this.options("event")+".jcarouselcontrol",this.onEvent),this._reload()},_destroy:function(){this._element.off(".jcarouselcontrol",this.onEvent),this.carousel().off("jcarousel:destroy",this.onDestroy).off("jcarousel:reloadend jcarousel:scrollend",this.onReload)},_reload:function(){var i,s=t.jCarousel.parseTarget(this.options("target")),e=this.carousel();if(s.relative)i=e.jcarousel(s.target>0?"hasNext":"hasPrev");else{var r="object"!=typeof s.target?e.jcarousel("items").eq(s.target):s.target;i=e.jcarousel("target").index(r)>=0}return this._active!==i&&(this._trigger(i?"active":"inactive"),this._active=i),this}})}(jQuery),function(t){"use strict";t.jCarousel.plugin("jcarouselPagination",{_options:{perPage:null,item:function(t){return'<a href="#'+t+'">'+t+"</a>"},event:"click",method:"scroll"},_carouselItems:null,_pages:{},_items:{},_currentPage:null,_init:function(){this.onDestroy=t.proxy(function(){this._destroy(),this.carousel().one("jcarousel:createend",t.proxy(this._create,this))},this),this.onReload=t.proxy(this._reload,this),this.onScroll=t.proxy(this._update,this)},_create:function(){this.carousel().one("jcarousel:destroy",this.onDestroy).on("jcarousel:reloadend",this.onReload).on("jcarousel:scrollend",this.onScroll),this._reload()},_destroy:function(){this._clear(),this.carousel().off("jcarousel:destroy",this.onDestroy).off("jcarousel:reloadend",this.onReload).off("jcarousel:scrollend",this.onScroll),this._carouselItems=null},_reload:function(){var i=this.options("perPage");if(this._pages={},this._items={},t.isFunction(i)&&(i=i.call(this)),null==i)this._pages=this._calculatePages();else for(var s,e=parseInt(i,10)||0,r=this._getCarouselItems(),n=1,o=0;;){if(s=r.eq(o++),0===s.length)break;this._pages[n]=this._pages[n]?this._pages[n].add(s):s,0===o%e&&n++}this._clear();var l=this,a=this.carousel().data("jcarousel"),h=this._element,u=this.options("item"),c=this._getCarouselItems().length;t.each(this._pages,function(i,s){var e=l._items[i]=t(u.call(l,i,s));e.on(l.options("event")+".jcarouselpagination",t.proxy(function(){var t=s.eq(0);if(a.circular){var e=a.index(a.target()),r=a.index(t);parseFloat(i)>parseFloat(l._currentPage)?e>r&&(t="+="+(c-e+r)):r>e&&(t="-="+(e+(c-r)))}a[this.options("method")](t)},l)),h.append(e)}),this._update()},_update:function(){var i,s=this.carousel().jcarousel("target");t.each(this._pages,function(t,e){return e.each(function(){return s.is(this)?(i=t,!1):void 0}),i?!1:void 0}),this._currentPage!==i&&(this._trigger("inactive",this._items[this._currentPage]),this._trigger("active",this._items[i])),this._currentPage=i},items:function(){return this._items},reloadCarouselItems:function(){return this._carouselItems=null,this},_clear:function(){this._element.empty(),this._currentPage=null},_calculatePages:function(){for(var t,i=this.carousel().data("jcarousel"),s=this._getCarouselItems(),e=i.clipping(),r=0,n=0,o=1,l={};;){if(t=s.eq(n++),0===t.length)break;l[o]=l[o]?l[o].add(t):t,r+=i.dimension(t),r>=e&&(o++,r=0)}return l},_getCarouselItems:function(){return this._carouselItems||(this._carouselItems=this.carousel().jcarousel("items")),this._carouselItems}})}(jQuery),function(t){"use strict";t.jCarousel.plugin("jcarouselAutoscroll",{_options:{target:"+=1",interval:3e3,autostart:!0},_timer:null,_init:function(){this.onDestroy=t.proxy(function(){this._destroy(),this.carousel().one("jcarousel:createend",t.proxy(this._create,this))},this),this.onAnimateEnd=t.proxy(this.start,this)},_create:function(){this.carousel().one("jcarousel:destroy",this.onDestroy),this.options("autostart")&&this.start()},_destroy:function(){this.stop(),this.carousel().off("jcarousel:destroy",this.onDestroy)},start:function(){return this.stop(),this.carousel().one("jcarousel:animateend",this.onAnimateEnd),this._timer=setTimeout(t.proxy(function(){this.carousel().jcarousel("scroll",this.options("target"))},this),this.options("interval")),this},stop:function(){return this._timer&&(this._timer=clearTimeout(this._timer)),this.carousel().off("jcarousel:animateend",this.onAnimateEnd),this}})}(jQuery);
!function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a="function"==typeof require&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}for(var i="function"==typeof require&&require,o=0;o<r.length;o++)s(r[o]);return s}({1:[function(require,module){module.exports=function(){function receivedResponse(xhr){return 200==xhr.status&&4==xhr.readyState}function handleResponse(xhr,callback){xhr.onreadystatechange=function(){if(receivedResponse(xhr))try{callback(null,JSON.parse(xhr.responseText))}catch(err){callback(err,null)}}}var self=this;self.load=function(location,callback){var xhr=window.XMLHttpRequest?new XMLHttpRequest:new ActiveXObject("Microsoft.XMLHTTP");xhr.open("GET",location,!0),handleResponse(xhr,callback),xhr.send()}}},{}],2:[function(require,module){function FuzzySearchStrategy(){function createFuzzyRegExpFromString(string){return new RegExp(string.split("").join(".*?"),"gi")}var self=this;self.matches=function(string,crit){return"string"!=typeof string?!1:(string=string.trim(),!!string.match(createFuzzyRegExpFromString(crit)))}}module.exports=new FuzzySearchStrategy},{}],3:[function(require,module){function LiteralSearchStrategy(){function doMatch(string,crit){return string.toLowerCase().indexOf(crit.toLowerCase())>=0}var self=this;self.matches=function(string,crit){return"string"!=typeof string?!1:(string=string.trim(),doMatch(string,crit))}}module.exports=new LiteralSearchStrategy},{}],4:[function(require,module){module.exports=function(){function findMatches(store,crit,strategy){for(var data=store.get(),i=0;i<data.length&&matches.length<limit;i++)findMatchesInObject(data[i],crit,strategy);return matches}function findMatchesInObject(obj,crit,strategy){for(var key in obj)if(strategy.matches(obj[key],crit)){matches.push(obj);break}}function getSearchStrategy(){return fuzzy?fuzzySearchStrategy:literalSearchStrategy}var self=this,matches=[],fuzzy=!1,limit=10,fuzzySearchStrategy=require("./SearchStrategies/fuzzy"),literalSearchStrategy=require("./SearchStrategies/literal");self.setFuzzy=function(_fuzzy){fuzzy=!!_fuzzy},self.setLimit=function(_limit){limit=parseInt(_limit,10)||limit},self.search=function(data,crit){return crit?(matches.length=0,findMatches(data,crit,getSearchStrategy())):[]}}},{"./SearchStrategies/fuzzy":2,"./SearchStrategies/literal":3}],5:[function(require,module){module.exports=function(_store){function isObject(obj){return!!obj&&"[object Object]"==Object.prototype.toString.call(obj)}function isArray(obj){return!!obj&&"[object Array]"==Object.prototype.toString.call(obj)}function addObject(data){return store.push(data),data}function addArray(data){for(var added=[],i=0;i<data.length;i++)isObject(data[i])&&added.push(addObject(data[i]));return added}var self=this,store=[];isArray(_store)&&addArray(_store),self.clear=function(){return store.length=0,store},self.get=function(){return store},self.put=function(data){return isObject(data)?addObject(data):isArray(data)?addArray(data):void 0}}},{}],6:[function(require,module){module.exports=function(){var self=this,templatePattern=/\{(.*?)\}/g;self.setTemplatePattern=function(newTemplatePattern){templatePattern=newTemplatePattern},self.render=function(t,data){return t.replace(templatePattern,function(match,prop){return data[prop]||match})}}},{}],7:[function(require){!function(window){"use strict";function SimpleJekyllSearch(){function initWithJSON(){store.put(opt.dataSource),registerInput()}function initWithURL(url){jsonLoader.load(url,function(err,json){err?throwError("failed to get JSON ("+url+")"):(store.put(json),registerInput())})}function throwError(message){throw new Error("SimpleJekyllSearch --- "+message)}function validateOptions(_opt){for(var i=0;i<requiredOptions.length;i++){var req=requiredOptions[i];_opt[req]||throwError("You must specify a "+req)}}function assignOptions(_opt){for(var option in opt)opt[option]=_opt[option]||opt[option]}function isJSON(json){try{return json instanceof Object&&JSON.parse(JSON.stringify(json))}catch(e){return!1}}function emptyResultsContainer(){opt.resultsContainer.innerHTML=""}function appendToResultsContainer(text){opt.resultsContainer.innerHTML+=text}function registerInput(){opt.searchInput.addEventListener("keyup",function(e){return 0==e.target.value.length?void emptyResultsContainer():void render(searcher.search(store,e.target.value))})}function render(results){if(emptyResultsContainer(),0==results.length)return appendToResultsContainer(opt.noResultsText);for(var i=0;i<results.length;i++)appendToResultsContainer(templater.render(opt.searchResultTemplate,results[i]))}var self=this,requiredOptions=["searchInput","resultsContainer","dataSource"],opt={searchInput:null,resultsContainer:null,dataSource:[],searchResultTemplate:'<li><a href="{url}" title="{desc}">{title}</a></li>',noResultsText:"No results found",limit:10,fuzzy:!1};self.init=function(_opt){validateOptions(_opt),assignOptions(_opt),isJSON(opt.dataSource)?initWithJSON(opt.dataSource):initWithURL(opt.dataSource)}}var Searcher=require("./Searcher"),Templater=require("./Templater"),Store=require("./Store"),JSONLoader=require("./JSONLoader"),searcher=new Searcher,templater=new Templater,store=new Store,jsonLoader=new JSONLoader;window.SimpleJekyllSearch=new SimpleJekyllSearch}(window,document)},{"./JSONLoader":1,"./Searcher":4,"./Store":5,"./Templater":6}]},{},[7]);
/**
 * Lightbox v2.7.1
 * by Lokesh Dhakar - http://lokeshdhakar.com/projects/lightbox2/
 *
 * @license http://creativecommons.org/licenses/by/2.5/
 * - Free for use in both personal and commercial projects
 * - Attribution requires leaving author name, author link, and the license info intact
 */

(function(){var a=jQuery,b=function(){function a(){this.fadeDuration=500,this.fitImagesInViewport=!0,this.resizeDuration=700,this.positionFromTop=50,this.showImageNumberLabel=!0,this.alwaysShowNavOnTouchDevices=!1,this.wrapAround=!1}return a.prototype.albumLabel=function(a,b){return"Image "+a+" of "+b},a}(),c=function(){function b(a){this.options=a,this.album=[],this.currentImageIndex=void 0,this.init()}return b.prototype.init=function(){this.enable(),this.build()},b.prototype.enable=function(){var b=this;a("body").on("click","a[rel^=lightbox], area[rel^=lightbox], a[data-lightbox], area[data-lightbox]",function(c){return b.start(a(c.currentTarget)),!1})},b.prototype.build=function(){var b=this;a("<div id='lightboxOverlay' class='lightboxOverlay'></div><div id='lightbox' class='lightbox'><div class='lb-outerContainer'><div class='lb-container'><img class='lb-image' src='' /><div class='lb-nav'><a class='lb-prev' href='' ></a><a class='lb-next' href='' ></a></div><div class='lb-loader'><a class='lb-cancel'></a></div></div></div><div class='lb-dataContainer'><div class='lb-data'><div class='lb-details'><span class='lb-caption'></span><span class='lb-number'></span></div><div class='lb-closeContainer'><a class='lb-close'></a></div></div></div></div>").appendTo(a("body")),this.$lightbox=a("#lightbox"),this.$overlay=a("#lightboxOverlay"),this.$outerContainer=this.$lightbox.find(".lb-outerContainer"),this.$container=this.$lightbox.find(".lb-container"),this.containerTopPadding=parseInt(this.$container.css("padding-top"),10),this.containerRightPadding=parseInt(this.$container.css("padding-right"),10),this.containerBottomPadding=parseInt(this.$container.css("padding-bottom"),10),this.containerLeftPadding=parseInt(this.$container.css("padding-left"),10),this.$overlay.hide().on("click",function(){return b.end(),!1}),this.$lightbox.hide().on("click",function(c){return"lightbox"===a(c.target).attr("id")&&b.end(),!1}),this.$outerContainer.on("click",function(c){return"lightbox"===a(c.target).attr("id")&&b.end(),!1}),this.$lightbox.find(".lb-prev").on("click",function(){return b.changeImage(0===b.currentImageIndex?b.album.length-1:b.currentImageIndex-1),!1}),this.$lightbox.find(".lb-next").on("click",function(){return b.changeImage(b.currentImageIndex===b.album.length-1?0:b.currentImageIndex+1),!1}),this.$lightbox.find(".lb-loader, .lb-close").on("click",function(){return b.end(),!1})},b.prototype.start=function(b){function c(a){d.album.push({link:a.attr("href"),title:a.attr("data-title")||a.attr("title")})}var d=this,e=a(window);e.on("resize",a.proxy(this.sizeOverlay,this)),a("select, object, embed").css({visibility:"hidden"}),this.sizeOverlay(),this.album=[];var f,g=0,h=b.attr("data-lightbox");if(h){f=a(b.prop("tagName")+'[data-lightbox="'+h+'"]');for(var i=0;i<f.length;i=++i)c(a(f[i])),f[i]===b[0]&&(g=i)}else if("lightbox"===b.attr("rel"))c(b);else{f=a(b.prop("tagName")+'[rel="'+b.attr("rel")+'"]');for(var j=0;j<f.length;j=++j)c(a(f[j])),f[j]===b[0]&&(g=j)}var k=e.scrollTop()+this.options.positionFromTop,l=e.scrollLeft();this.$lightbox.css({top:k+"px",left:l+"px"}).fadeIn(this.options.fadeDuration),this.changeImage(g)},b.prototype.changeImage=function(b){var c=this;this.disableKeyboardNav();var d=this.$lightbox.find(".lb-image");this.$overlay.fadeIn(this.options.fadeDuration),a(".lb-loader").fadeIn("slow"),this.$lightbox.find(".lb-image, .lb-nav, .lb-prev, .lb-next, .lb-dataContainer, .lb-numbers, .lb-caption").hide(),this.$outerContainer.addClass("animating");var e=new Image;e.onload=function(){var f,g,h,i,j,k,l;d.attr("src",c.album[b].link),f=a(e),d.width(e.width),d.height(e.height),c.options.fitImagesInViewport&&(l=a(window).width(),k=a(window).height(),j=l-c.containerLeftPadding-c.containerRightPadding-20,i=k-c.containerTopPadding-c.containerBottomPadding-120,(e.width>j||e.height>i)&&(e.width/j>e.height/i?(h=j,g=parseInt(e.height/(e.width/h),10),d.width(h),d.height(g)):(g=i,h=parseInt(e.width/(e.height/g),10),d.width(h),d.height(g)))),c.sizeContainer(d.width(),d.height())},e.src=this.album[b].link,this.currentImageIndex=b},b.prototype.sizeOverlay=function(){this.$overlay.width(a(window).width()).height(a(document).height())},b.prototype.sizeContainer=function(a,b){function c(){d.$lightbox.find(".lb-dataContainer").width(g),d.$lightbox.find(".lb-prevLink").height(h),d.$lightbox.find(".lb-nextLink").height(h),d.showImage()}var d=this,e=this.$outerContainer.outerWidth(),f=this.$outerContainer.outerHeight(),g=a+this.containerLeftPadding+this.containerRightPadding,h=b+this.containerTopPadding+this.containerBottomPadding;e!==g||f!==h?this.$outerContainer.animate({width:g,height:h},this.options.resizeDuration,"swing",function(){c()}):c()},b.prototype.showImage=function(){this.$lightbox.find(".lb-loader").hide(),this.$lightbox.find(".lb-image").fadeIn("slow"),this.updateNav(),this.updateDetails(),this.preloadNeighboringImages(),this.enableKeyboardNav()},b.prototype.updateNav=function(){var a=!1;try{document.createEvent("TouchEvent"),a=this.options.alwaysShowNavOnTouchDevices?!0:!1}catch(b){}this.$lightbox.find(".lb-nav").show(),this.album.length>1&&(this.options.wrapAround?(a&&this.$lightbox.find(".lb-prev, .lb-next").css("opacity","1"),this.$lightbox.find(".lb-prev, .lb-next").show()):(this.currentImageIndex>0&&(this.$lightbox.find(".lb-prev").show(),a&&this.$lightbox.find(".lb-prev").css("opacity","1")),this.currentImageIndex<this.album.length-1&&(this.$lightbox.find(".lb-next").show(),a&&this.$lightbox.find(".lb-next").css("opacity","1"))))},b.prototype.updateDetails=function(){var b=this;"undefined"!=typeof this.album[this.currentImageIndex].title&&""!==this.album[this.currentImageIndex].title&&this.$lightbox.find(".lb-caption").html(this.album[this.currentImageIndex].title).fadeIn("fast").find("a").on("click",function(){location.href=a(this).attr("href")}),this.album.length>1&&this.options.showImageNumberLabel?this.$lightbox.find(".lb-number").text(this.options.albumLabel(this.currentImageIndex+1,this.album.length)).fadeIn("fast"):this.$lightbox.find(".lb-number").hide(),this.$outerContainer.removeClass("animating"),this.$lightbox.find(".lb-dataContainer").fadeIn(this.options.resizeDuration,function(){return b.sizeOverlay()})},b.prototype.preloadNeighboringImages=function(){if(this.album.length>this.currentImageIndex+1){var a=new Image;a.src=this.album[this.currentImageIndex+1].link}if(this.currentImageIndex>0){var b=new Image;b.src=this.album[this.currentImageIndex-1].link}},b.prototype.enableKeyboardNav=function(){a(document).on("keyup.keyboard",a.proxy(this.keyboardAction,this))},b.prototype.disableKeyboardNav=function(){a(document).off(".keyboard")},b.prototype.keyboardAction=function(a){var b=27,c=37,d=39,e=a.keyCode,f=String.fromCharCode(e).toLowerCase();e===b||f.match(/x|o|c/)?this.end():"p"===f||e===c?0!==this.currentImageIndex?this.changeImage(this.currentImageIndex-1):this.options.wrapAround&&this.album.length>1&&this.changeImage(this.album.length-1):("n"===f||e===d)&&(this.currentImageIndex!==this.album.length-1?this.changeImage(this.currentImageIndex+1):this.options.wrapAround&&this.album.length>1&&this.changeImage(0))},b.prototype.end=function(){this.disableKeyboardNav(),a(window).off("resize",this.sizeOverlay),this.$lightbox.fadeOut(this.options.fadeDuration),this.$overlay.fadeOut(this.options.fadeDuration),a("select, object, embed").css({visibility:"visible"})},b}();a(function(){{var a=new b;new c(a)}})}).call(this);
window.trackScrollAndMouseDistance = function (className, func, radius, hoverAtYPercent) {
    var calcDistanceInPercentageFromMouseAndViewportCentre = function (me, el) {
        var distanceBetween = function (p1, p2) {
            return Math.abs(Math.sqrt(Math.pow((p2.x - p1.x), 2) + Math.pow((p2.y - p1.y), 2)));
        }
        var yp = .5;
        if (hoverAtYPercent) yp = (hoverAtYPercent / 100);
        var v = {
            x: window.innerWidth / 2,
            y: window.innerHeight * yp
        };
        var r = el.getBoundingClientRect();
        var e = {
            x: r.left + ((r.right - r.left) / 2),
            y: r.top + ((r.bottom - r.top) / 2)
        };
        var d = 0;
        if (typeof me !== 'undefined' && me != null) {
            var m = {
                x: me.pageX,
                y: me.pageY
            };
            m.x = m.x - window.pageXOffset;
            m.y = m.y - window.pageYOffset;
            d = distanceBetween(m, e) / radius;
        } else {
            d = distanceBetween(e, v) / radius;
        }
        d = 100 - d;
        var p = Math.round(d) / 100;
        return p;
    }

    var apply = function (me) {
        Array.prototype.slice.call(document.getElementsByClassName(className), 0)
            .every(function (e) {
                func(e, calcDistanceInPercentageFromMouseAndViewportCentre(me, e));
                return true;
            });
    }

    document.documentElement.addEventListener('mousemove', function (me) {
        apply(me)
    }, false);
    window.addEventListener('scroll', function () {
        apply()
    }, false);
    window.addEventListener('resize', function () {
        apply()
    }, false);
    
    window.addEventListener('swipeleft', function () {
        apply()
    }, false);
    window.addEventListener('swiperight', function () {
        apply()
    }, false);
    window.addEventListener('swipeup', function () {
        apply()
    }, false);
    window.addEventListener('swipedown', function () {
        apply()
    }, false);
};
jQuery(document).ready(function () {
    jQuery("#main-menu").load("/global-menu.html");
    jQuery("#footer").load("/global-footer.html");
});

jQuery(document).on("click", "#question", function (e) {
    var pageURL = jQuery(location).attr("href");
    //var formURL = 'https://network.cornwall.ac.uk/form/'
    e.preventDefault();
    //window.location.href = $(this).attr("href") + '?' + pageURL;  
    window.location.href = jQuery(this).attr("href") + 'referrer=' + pageURL;
});




$(document).ready(function () {
    
    //set brand from site config
    Cookies.set('brand', '#duchy' );             
    Cookies.set('course-brand', '#duchy', {
        domain: '.duchy.ac.uk'
    });


    if(is_IOS()){
        //background:; cover fix
        $('.jumbotron').css({ 'background-size': "initial" });
        $('.fulltime-bar').css({ 'background-size': "initial", 'background-attachment': "initial", });
    }      
    
    function is_IOS() {
      var isIOS = /iPad|iPhone|iPod/.test(navigator.platform);  
        return isIOS;
    }  
});
    

    // resposive logo; first click open second click follow link
    $('.brand-image').click(function (e) {
        var scroll = $(window).scrollTop();
        var window = $( window ).width();
        if (scroll >= 301 || window <= 600){

            if (!$('#logo-wrap').children().hasClass('active')) {
                //$('#logo-wrap').removeClass('active');
                $('#logo-wrap').children().addClass('active');
                e.preventDefault();
            } else {
                $('#logo-wrap').children().removeClass('active');
               return true;
            }

        }
    });   


// click off and collapse
$(document).click(function (e) {
    if ($(e.target).is('.brand-image') === false) {
        $("#logo-wrap").children().removeClass("active");
    }
});

/* Shrink logo on scroll */
$(function () {
    var logoWrap = $("#logo-wrap");
    var currentBrand = $(".current-brand");
    $(window).scroll(function () {
        var scroll = $(window).scrollTop();

        if (scroll >= 300) {
            //if page scrolls add scroll class and remove active class
            logoWrap.removeClass("logo-wrap").addClass("logo-wrap-scroll");
            currentBrand.addClass("current-brand-scroll");
            $("#logo-wrap").children().removeClass("active");

            // Add click to expand logo cluster
            $(".brand-image").click(function () {
                logoWrap.removeClass("logo-wrap-scroll")
            });

            //add active class to white bg behind logos (slides down)
            $('#white-nav-bg').addClass('active');
        } else {
            // if its at the top of the page
            logoWrap.removeClass("logo-wrap-scroll").addClass('logo-wrap');
            //remove active class at the top of the page
            $('#white-nav-bg').removeClass('active');

        }
  
  
    });
});


/* SUPER SLIDES OPTIONS */
if ($("#slides").length) {
    $('#slides').superslides({
        animation: 'fade',
        play: 5000
    });
}

/* BACK BUTTON */
function goBack() {
    window.history.back()
}
/* BACK BUTTON ENDS*/

"use strict";

cc = {};

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function incrementCount(counter) {
    var max = Number($(counter).attr("data-count-to"));
    var stepSize = Number($(counter).attr("data-count-step"));
    var numberText = $(counter).html();
    var current = Number(numberText.replace(',', '').replace('£', ''));
    var prefix = '';
    if (numberText.substring(0, 1) === '£') {
        prefix = '£';
    }
    if (current < max) {
        var nextNumber = current + stepSize
        var nextNumber = Number(nextNumber.toFixed(0));
        if (nextNumber > max) {
            nextNumber = Number(max.toFixed(0));
        }
        $(counter).html(prefix + numberWithCommas(nextNumber));
        window.setTimeout(function () {
            incrementCount(counter)
        }, 10);
    }
}

(function ($) {
    
    
    $(document).ready(function () {
    /* Set brand cookie on home */
        $('.logo').removeClass('current-brand');
        $('.logo').addClass('sub-brand grow');
        $( Cookies.get('brand') ).removeClass('grow');
        $( Cookies.get('brand') ).addClass('current-brand');
        //bring the active logo to the front
        $( Cookies.get('brand') ).css("z-index", "999");

        //apply z-index to correctly stack the logos
        var offset = 1;
        $( Cookies.get('brand') ).prevAll().each(function(index){
           $(this).css("z-index", 999 - offset);
            offset++;
        });
        $( Cookies.get('brand') ).nextAll().each(function(index){
           $(this).css("z-index", 999 - offset);
            offset++;

        });        
        
        
        $('#loader').fadeOut(400);
        /*
            $(window).load(function() { // makes sure the whole site is loaded

            var hash = location.hash.replace('#', '').toLowerCase();
            if(hash.length)
            {
                showPopup(hash);
            }
        */
        
       /* EXPANDER GRID INITIALIZER (used in location facilities) */
       if ( $( "#og-grid" ).length ) {
          Grid.init();
       }

       /* FULL-TIME-HUB - Job Lookup */

       if (location.pathname.indexOf("career-hub") !== -1) {
           SimpleJekyllSearch.init({
               searchInput: document.getElementById('jobs-input'),
               resultsContainer: document.getElementById('jobs-results'),
               dataSource: '/data/jobs.json',
               searchResultTemplate: '<li><a href="/career-pages/{url}/index.html" title="{title}">{title}</a></li>',
               noResultsText: '<li>None found, please choose from below</li>',
               limit: 10,
               fuzzy: false,
           })
       }


    });


    /* MENU TOGGLING - 1.7 update*/
    if ($("#cbp-spmenu-s2").length) {
        var openRightPush = document.getElementById('openRightPush'),
            menuRight = document.getElementById('cbp-spmenu-s2'),
            body = document.body;

        openRightPush.onclick = function () {
            classie.toggle(this, 'active');
            $('.menu-icon > i').toggleClass("fa-bars");
            $('.menu-icon > i').toggleClass("fa-times");
            $('.menu-text').html($('.menu-text').html() == 'MENU' ? 'CLOSE' : 'MENU');
            classie.toggle(menuRight, 'cbp-spmenu-open');
        };

    }

    /* the id="menu-container" has to be added to the one-page template,
       to the <div class="container"> of the <nav id="cbp-spmenu-s2">

    */

    if ($("#menu-container").length) {
        var menuContainer = document.getElementById('menu-container'),
            menuRight = document.getElementById('cbp-spmenu-s2'),
            body = document.body;

        menuContainer.onclick = function () {
            classie.toggle(this, 'active');
            classie.toggle(menuRight, 'cbp-spmenu-open');
        };

    }

    /* end of 1.7 update */

    /* ISOTOPE FOR PORTFOLIO ITEMS */
    if ($("#career-grid").length) {
        var $container = $('#career-grid').imagesLoaded(function () {
            var isotope = function () {
                $container.isotope({
                    resizable: false,
                    itemSelector: '.entry'
                });
            };
            isotope();
        });

        $('div.career-filter ul a').click(function () {
            var selector = $(this).attr('data-filter');
            if (selector) {
                $('html, body').animate({
                    scrollTop: $('#career-grid-anchor').offset().top
                }, 500);
                $container.isotope({
                    filter: selector,
                    animationOptions: {
                        duration: 750,
                        easing: 'linear',
                        queue: false
                    }
                });
                return false;
            }
            return true;
        });

        var $optionSets = $('div.career-filter ul'),
            $optionLinks = $optionSets.find('a');
        $optionLinks.click(function () {
            var $this = $(this);
            // don't proceed if already selected
            if ($this.hasClass('selected')) {
                return false;
            }
            var $optionSet = $this.parents('div.career-filter ul');
            $optionSet.find('.selected').removeClass('selected');
            $this.addClass('selected');
        });

        $container.isotope({
            filter: "load",
            animationOptions: {
                duration: 750,
                easing: 'linear',
                queue: false
            }
        });

        var thenDoThis1 = function (e, p) {
            if ($(window).width() <= 480) {
                e.style.opacity = Math.min(1, p);
                return;
            }
            if ($(window).width() <= 1024) {
                e.style.opacity = Math.min(1, p * 1.5);
            }
        };
        window.trackScrollAndMouseDistance("auto-hover", thenDoThis1, 6, 33);

        var thenDoThis2 = function (e, p) {
            if ($(window).width() <= 480) {
                e.style.opacity = 0.25 + Math.max(0, p);
            }
        };
        window.trackScrollAndMouseDistance("cluster-hover", thenDoThis2, 3, 50);

    }

    /* CAREER-slide - Job Lookup */
    $(document).ready(function () {
        if (location.pathname === "career-pages") {
            SimpleJekyllSearch.init({
                searchInput: document.getElementById('jobs-input'),
                resultsContainer: document.getElementById('jobs-results'),
                dataSource: '/data/jobs.json',
                searchResultTemplate: '<li><a href="/career-pages/{url}/index.html" title="{title}">{title}</a></li>',
                noResultsText: '<li>None found, please choose from below</li>',
                limit: 10,
                fuzzy: false,
            })
        }


    /* CAREER PAGES */
        if (location.pathname.indexOf("career-pages") !== -1) {

            $(document).on("click", "[aria-expanded]", function (event) {
                var item = $(this).attr("aria-controls");
                if ($("#" + item).hasClass("in") === false) {
                    $("#" + item).find(".counter").each(function () {
                        var countTo = 0;
                        if ($(this).attr("data-count-to") == undefined) {
                            var max = Number($(this).html().replace(",", "").replace('£', ''));
                            $(this).attr("data-count-to", max);
                            var stepSize = max / 2 / 100;
                            $(this).attr("data-count-step", stepSize);
                        }
                        var html = $(this).html();
                        if (html.substring(0, 1) === '£') {
                            $(this).html("£0");
                        } else {
                            $(this).html("0");
                        }
                        countTo = $(item).attr("data-count-to");
                        incrementCount(this);
                    });
                }
            });



        }
    });

    $(function () {
        window.smoothScrollTo = function (id) {
            $('html, body').animate({
                scrollTop: $('#' + id).offset().top - 50
                //scrollTop: $('#' + id).offset().top
            }, 500);
            return false;
        }
    });

    $(function () {
        window.desktopRedirectOrMobileSmoothScrollTo = function (id, url) {
            if ($(window).width() <= 480) {
                $('html, body').animate({
                    scrollTop: $('#' + id).offset().top - 50
                }, 500);
            } else {
                window.location.href = url;
            }
            return false;
        };
    });

    $(function () {
        window.restoreZoomAndScrollTo = function (id) {
            //var scale = 'scale(1)';
            //document.body.style.webkitTransform =  scale;    // Chrome, Opera, Safari
            //document.body.style.msTransform =   scale;       // IE 9
            //document.body.style.transform = scale;
            $('#' + id).blur();
            window.smoothScrollTo(id);
            return false;
        };
    });

    // prevent default action on example career expand
    jQuery('.collapsed').bind('click', function (e) {
        e.preventDefault();
    });

})(jQuery);



//Campus Google Map script

$(document).ready(function () {
    //GOOGLE MAP
    if (location.pathname.indexOf("career-pages") !== -1 ||
        location.pathname.indexOf("location-hub") !== -1 ||
        location.pathname.indexOf("location-pages") !== -1) {
        function initMap() {
            var map = new google.maps.Map(document.getElementById('gmap_canvas'), {
                zoom: 9,
                center: {
                    lat: 50.304513,
                    lng: -5.000000
                },
                scrollwheel: false,
                styles: [
                    {
                        "featureType": "administrative",
                        "stylers": [{ "visibility": "off" }]
                    },
                    {
                        "featureType": "poi",
                        "stylers": [{ "visibility": "off" }]
                    },
                    {
                        "featureType": "road",
                        "stylers": [{ "visibility": "off" }]
                    },
                    {
                        "featureType": "landscape",
                        "stylers": [{ "visibility": "off" }]
                    },
                    {
                        "featureType": "water",
                        "elementType": "geometry.fill",
                        "stylers": [{ "saturation": -13 },
                            { "color": "#52b3d9" },
                            { "visibility": "on" }
                        ]
                    },
                    {
                        "featureType": "transit",
                        "stylers": [{ "visibility": "off" }]
                    },
                    {
                        "featureType": "landscape",
                        "elementType": "geometry.fill",
                        "stylers": [{ "color": "#ffffff" },
                            { "visibility": "on" },
                            { "weight": 5.2 }]
                    }
                ]


            });
            if (location.pathname.indexOf("location-pages") !== -1) {
                var map = new google.maps.Map(document.getElementById('gmap_canvas'), {
                    zoom: 9,
                    center: {
                        lat: 50.304513,
                        lng: -5.000000
                    },
                    scrollwheel: false,
                    styles: [

                        {
                            "featureType": "poi",
                            "stylers": [{ "visibility": "off" }]
                        },
                        {
                            "featureType": "landscape",
                            "elementType": "geometry.fill",
                            "stylers": [{ "color": "#ffffff" },
                                { "visibility": "on" },
                                { "weight": 5.2 }]
                        },
                        {
                            "featureType": "water",
                            "elementType": "geometry.fill",
                            "stylers": [{ "saturation": -13 },
                                { "color": "#52b3d9" },
                                { "visibility": "on" }]
                        }
                    ]
                });
            };

            map.fitBounds(setMarkers(map));

        }

        function setMarkers(map) {
            var bounds = new google.maps.LatLngBounds();

            // Data for the markers consisting of a name, a LatLng and a zIndex for the
            // order in which these markers should display on top of each other.

            //init the info window and set the max width
            var infowindow = new google.maps.InfoWindow({
                maxWidth: 200
            });

            //Loop through the locations
            for (var i = 0; i < campuses.length; i++) {
                var campus = campuses[i];
                var marker = new google.maps.Marker({
                    position: {
                        lat: campus[1],
                        lng: campus[2]
                    },
                    map: map,
                    //icon: image,
                    //shape: shape,
                    title: campus[0],
                    anchor: campus[4]
                    //zIndex: beach[3]
                });
                if (location.pathname.indexOf("location-hub") !== -1) {

                    // stuff just for the location hub map
                    google.maps.event.addListener(marker, 'click', (function (marker, i) {
                        return function () {
                            //window.location.href = this.anchor;
                            //window.smoothScrollTo = this.anchor;
                            window.smoothScrollTo(this.anchor)
                        }
                    })(marker, i));
                
                } else if (location.pathname.indexOf("location-pages") !== -1) {

                    google.maps.event.addListener(marker, 'click', (function (marker, i) {
                        return function () {
                            infowindow.setContent('<h4>' + campuses[i][0] + '</h4>');
                            infowindow.open(map, marker);
                        }
                    })(marker, i));                    
                    
                } else {

                    google.maps.event.addListener(marker, 'click', (function (marker, i) {
                        return function () {
                            infowindow.setContent('<h4>' + campuses[i][0] + '</h4>' + '<a href="' + campuses[i][3] + '" class="campus-button">Visit our campus site</a>');
                            infowindow.open(map, marker);
                        }
                    })(marker, i));

                }

                bounds.extend(marker.getPosition());

            }

            // Don't zoom in too far on only one marker
            if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
                var extendPoint1 = new google.maps.LatLng(bounds.getNorthEast().lat() + 0.01, bounds.getNorthEast().lng() + 0.01);
                var extendPoint2 = new google.maps.LatLng(bounds.getNorthEast().lat() - 0.01, bounds.getNorthEast().lng() - 0.01);
                bounds.extend(extendPoint1);
                bounds.extend(extendPoint2);
            }

            return bounds;


        }

        google.maps.event.addDomListener(window, 'load', initMap);
    };



});

   /* JCAROUSEL RESPONSIVENESS */
   $(function() {
       if ( $( ".jcarousel" ).length ) {
         var jcarousel = $('.jcarousel');
       
         jcarousel
             .on('jcarousel:reload jcarousel:create', function () {
                 var width = jcarousel.innerWidth();
       
                 if (width >= 768) {
                     width = width / 4;
                 } else if (width >= 450) {
                     width = width / 2;                                     
                 } 
       
                 jcarousel.jcarousel('items').css('width', width + 'px');
             })
             .jcarousel({
                 wrap: 'circular'
             });
   
         $('.jcarousel-control-prev')
             .jcarouselControl({
                 target: '-=1'
             });
       
         $('.jcarousel-control-next')
             .jcarouselControl({
                 target: '+=1'
             });
   
         $('.jcarousel-pagination')
             .on('jcarouselpagination:active', 'a', function() {
                 $(this).addClass('active');
             })
             .on('jcarouselpagination:inactive', 'a', function() {
                 $(this).removeClass('active');
             })
             .on('click', function(e) {
                 e.preventDefault();
             })
             .jcarouselPagination({
                 perPage: 1,
                 item: function(page) {
                     return '<a href="#' + page + '">' + page + '</a>';
                 }
             });
       }
   });



$(document).ready(function(){
	var onMobile = false;
	if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) { onMobile = true; }
	if( ( onMobile === false ) ) {
		// The videoplayer - controlled background video
		$(".fullscreen-video").mb_YTPlayer({
			containment: "body",
			opacity: 1, // Set the opacity of the player;
			mute: false, // Mute the audio;
			// ratio: "4/3" or "16/9" to set the aspect ratio of the movie;
			// quality: "default" or "small", "medium", "large", "hd720", "hd1080", "highres";
			// containment: The CSS selector of the DOM element where you want the video background; if not specified it takes the "body"; if set to "self" the player will be instanced on that element;
			// optimizeDisplay: True will fit the video size into the window size optimizing the view;
			loop: false, // True or false loops the movie once ended.
			// vol: 1 to 100 (number) set the volume level of the video.
            addRaster: true,
			startAt: 0, // Set the seconds the video should start at.
			autoPlay:false, // True or false play the video once ready.
			showYTLogo: false, // Show or hide the YT logo and the link to the original video URL.
			showControls: false // Show or hide the controls bar at the bottom of the page.
		});

		// First we're going to hide these elements
		$(".video-controls").hide();

		// Start the movie
		$("#video").on("YTPStart",function(){
			$(".video-controls").show().css({opacity: 0, visibility: "visible"}).animate({opacity: 1},300);
			//$(".fullscreen-img, .home-content").css({opacity: 1, visibility: "hidden"}).animate({opacity: 0},300);
		});
        //Hide the UI 
        $( ".play-btn-normal" ).click(function() {
            $(".fullscreen-img, .home-content").css({opacity: 1, visibility: "hidden"}).animate({opacity: 0},300);
            $(".raster").css({opacity: 1, visibility: "hidden"}).animate({opacity: 0},300);               
		});
		// Pause the movie
		$("#video").on("YTPPause",function(){
			$(".fullscreen-img, .home-content").css({opacity: 0, visibility: "visible"}).animate({opacity: 1},300);
			$(".video-controls").css({opacity: 1, visibility: "hidden"}).animate({opacity: 0},300);
		});

		$("#video").on("YTPFullScreenStart",function(){
            $("#video").playYTP();
            $("#wrapper_mbYTP_video").show();
		});
		// exit full screen
		$("#video").on("YTPFullScreenEnd",function(){
            $("#video").YTPStop();
            $("#wrapper_mbYTP_video").hide();

		});
	} else {
		// Fallback for mobile devices
		$("#home").removeClass(".video");
		$(".fullscreen-video, .video-controls, .play-btn-normal").hide();
	}

    
    if (location.pathname.indexOf("location-pages") !== -1 ||
        location.pathname.indexOf("apprenticeship-hub") !== -1) {        
        //jQuery RSS parse for events on campus pages
        
        var campus_id = $("#event-carousel").attr("data-event-campus-id");
        
        if (location.pathname.indexOf("apprenticeship-hub") !== -1){
            var event_filter = "https://network.cornwall.ac.uk//events/whats-on/category/apprenticeship-event/feed/";
        } else {
            var event_filter = "https://network.cornwall.ac.uk//events/whats-on/feed/?post_type=tribe_events&venue=" + campus_id;
        }

        var rssurl = event_filter;
        $.get(rssurl, function (data) {
            var $XML = $(data);
            $XML.find("item").each(function () {

                var $this = $(this),
                    item = {
                        title: $this.find("title").text(),
                        link: $this.find("link").text(),
                        description: $this.find("description").text(),
                        pubDate: $this.find("pubDate").text(),
                        author: $this.find("author").text(),
                        organizer: $this.find("organizer").text(),
                        venue: $this.find("venue").text(),
                        enddate: $this.find("enddate").text(),
                        startdate: $this.find("startdate").text(),
                        category: $this.find("category").text(),

                    };
                var event = $('<div/>').addClass("owl-item");
                var article = $('<article/>').addClass("transition text-center");
                var link = item.link;
                $(event).append((article).append($('<h3/>').text(item.title)));
                $(event).append((article).append($('<p/>').text(item.organizer).addClass("organizer")));
                $(event).append((article).append($('<p/>').text(item.venue).addClass("venue")));
                $(event).append((article).append($('<p/>').text(item.startdate).addClass("startdate ")));
                if (item.enddate) { $(event).append((article).append($('<p/>').text(item.enddate).addClass("enddate "))); }
                //$(event).append((article).append($('<p/>').text(item.category).addClass( "category " )));
                $(event).append((article).append("<a href='" + item.link + "' title='" + item.title + "' class='btn pull-right'>View event details</a>"));

                $(".owl-carousel").append(event);
                //etc...

            });

            if ($("#event-carousel").length) {
                $('#event-carousel').owlCarousel({
                    items: 1,
                    margin: 10,
                    //loop: true,
                    loop: $('#event-carousel').children().length > 1,
                    //nav: $('#event-carousel').children().length > 1,
                    animateOut: 'fadeOut',
                    autoplay: true,
                });
            }
        });
    }
});
/*------------------- Download  filer ISOTOPE ----------------------*/
if (location.pathname.indexOf("about-pages") !== -1) {
    // init Isotope
    var $grid = $('#download-list').isotope({
      itemSelector: '.download',
      layoutMode: 'masonry'
    });

    // filter items on button click
    $('.filter-button-group').on( 'click', 'button', function() {
      var filterValue = $(this).attr('data-filter');
      $grid.isotope({ filter: filterValue });
    });
}
/*------------------- learning area filer ISOTOPE ----------------------*/
if (location.pathname.indexOf("learning-area-hub") !== -1 || location.pathname.indexOf("sector-hub") !== -1) {
    $(document).ready(function () {

        //createItems();

        var $container = $('#career-content').isotope({
            itemSelector: '.area',
            //resizable: false
        });

        var $sector = $('#sector-page-content').isotope({
            itemSelector: '.area',
            //resizable: false
        });
        function rebuildLayout(id) { 
            $(id).isotope( 'layout' );     
        }        
        // read more link on Learning area page     
        $container.on('click', '.show-more', function () {
            // change size of item by toggling big class
            if($(this).parent().find(".detail").is(':visible')){
                $(this).parent().find(".detail").fadeOut(50);
            }
            else{
               $(this).parent().find(".detail").fadeIn(1500);   
            }
            
            $(this).parent().toggleClass('big');

            //hide the readmore link  
            $(this).children(".readmore").toggle();
            //re-build the layout after a delay 
            setTimeout(function(){rebuildLayout('#career-content')}, 300);
        });

        // read more link on sector page    
        $sector.on('click', '.show-more', function () {
            $(this).parent().toggleClass('big');
            $(this).children(".readmore").toggle();
            $sector.isotope('layout');
            //re-build the layout after a delay 
            setTimeout(function(){rebuildLayout('#sector-page-content')}, 300);
        });

        // filter items on button click Sector hub page
        $('.link-wrap').on('click', 'button', function () {
            var filterValue = $(this).attr('data-filter');

            $sector.isotope({ filter: filterValue });
            $sector.show();
            //if 16-18 show the 'how you learn' filters 
            $sector.isotope('layout');
            $('html, body').animate({
                scrollTop: $('#sector-page-content').offset().top - 150
            }, 1000);

        });

        var $output = $('#output');

        // filter with selects and checkboxes
        var $checkboxes = $('#form-ui input');
        //declare the courseType var for use later    
        var courseType;
        var campusFilter;
        var brandFilter;

        $('#form-ui label.btn').click(function ($event) {
            // Deselect all other options
            var $clickedButton = $($event.target);

            $clickedButton.siblings('.active').click();
        });

        $checkboxes.change(function () {
            // map input values to an array   
            //var exclusives = [];
            var inclusives = [];
            //get and set course type data value
            courseType = $(this).attr("data-course-type") || courseType;
            //get and set campus data value
            campusFilter = $(this).attr("data-campus") || campusFilter;
            //get and set brand data value  
            brandFilter = $(this).attr("data-brand") || brandFilter;
            // inclusive filters from checkboxes

            $checkboxes.each(function (i, elem) {
                // if checkbox, use value if checked
                if (elem.checked) {
                    inclusives.push(elem.value);
                    $sector.show();
                    $sector.isotope('layout');
                }
            });

            // combine inclusive filters
            var filterValue = inclusives.length ? inclusives.join('') : '*';

            $output.text(filterValue);
            $container.isotope({
                filter: filterValue,
                queue: false,
                resizable: false
            })
        });

        // set the course area on click    
        $('.course-area').click(function () {
            //event.preventDefault();
            if (typeof courseType !== "undefined") {
                $(this).attr('href', function () {
                    return this.href + '/course_type/' + courseType;
                });
            }
            if (typeof campusFilter !== "undefined") {
                $(this).attr('href', function () {
                    return this.href + '/campus/' + campusFilter;
                });
            }
            if (typeof brandFilter !== "undefined") {
                $(this).attr('href', function () {
                    return this.href + '/brand/' + brandFilter;
                });
            }

        });
        $('.campus').click(function () {
            //event.preventDefault();

        });

        // Preset options 
        var brand_cookie = Cookies.get('brand');
        if (brand_cookie == '#duchy') {
            $('.area-filter > input[value=".dc"]').parent().click();
        } else if (brand_cookie == '#falmouth') {
            $('.area-filter > input[value=".fms"]').parent().click();
        } else if (brand_cookie == '#bicton') {
            $('.area-filter > input[value=".bic"]').parent().click();
        }

    });

        $(".isotope-reset").click(function(){
            $(".content ul.sort").isotope({
            filter: '*'
            });
        });
    
}
    
$(document).ready(function () {
    $( ".tile1" ).click(function() {
        $( ".content1" ).slideToggle( "slow", "swing");
        $( ".content2" ).slideUp( "slow", "swing");
        $( ".content3" ).slideUp( "slow", "swing");
        $( ".content4" ).slideUp( "slow", "swing");
    });
    
    $( ".tile2" ).click(function() {
        $( ".content2" ).slideToggle( "slow", "swing");
        $( ".content1" ).slideUp( "slow", "swing");
        $( ".content3" ).slideUp( "slow", "swing");
        $( ".content4" ).slideUp( "slow", "swing");
    });
    
    $( ".tile3" ).click(function() {
        $( ".content3" ).slideToggle( "slow", "swing");
        $( ".content1" ).slideUp( "slow", "swing");
        $( ".content2" ).slideUp( "slow", "swing");
        $( ".content4" ).slideUp( "slow", "swing");
    });
    
    $( ".tile4" ).click(function() {
        $( ".content4" ).slideToggle( "slow", "swing");
        $( ".content1" ).slideUp( "slow", "swing");
        $( ".content2" ).slideUp( "slow", "swing");
        $( ".content3" ).slideUp( "slow", "swing");
    });
});
// get announcement from 
jQuery(document).ready(function () {
    // Lookup alert message and display if required
    jQuery.getJSON('https://network.cornwall.ac.uk/?action=ccg_get_announcement', function(data) {
        if(data.enabled && data.message) {
            $('#alert-container').html('<div class="announce-alert">' + data.message + '</div>');
            $('#alert-container').show();
        }
    });
});













