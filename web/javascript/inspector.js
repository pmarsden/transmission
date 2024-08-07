/**
 * Copyright © Charles Kerr, Dave Perrett, Malcolm Jarvis and Bruno Bierbaumer
 *
 * This file is licensed under the GPLv2.
 * http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 */

function Inspector(controller) {

	var data = {
			controller: null,
			elements: {},
			torrents: []
		},

		needsExtraInfo = function (torrents) {
			var i, id, tor;

			for (i = 0; tor = torrents[i]; i++)
				if (!tor.hasExtraInfo())
					return true;

			return false;
		},

		refreshTorrents = function (callback) {
			var fields,
				ids = $.map(data.torrents.slice(0), function (t) {
					return t.getId();
				});

			if (ids && ids.length) {
				fields = ['id'].concat(Torrent.Fields.StatsExtra);

				if (needsExtraInfo(data.torrents)) {
					$.merge(fields, Torrent.Fields.InfoExtra);
				}

				data.controller.updateTorrents(ids, fields, callback);
			}
		},

		onTabClicked = function (ev) {
			var tab = ev.currentTarget;

			if (isMobileDevice) {
				ev.stopPropagation();
			}

			// select this tab and deselect the others
			$(tab).addClass('selected').siblings().removeClass('selected');

			// show this tab and hide the others
			$('#' + tab.id.replace('tab', 'page')).show().siblings('.inspector-page').hide();

			updateInspector();
		},

		updateInspector = function () {
			var e = data.elements,
				torrents = data.torrents,
				name;

			// update the name, which is shown on all the pages
			if (!torrents || !torrents.length) {
				name = 'No Selection';
			} else if (torrents.length === 1) {
				name = torrents[0].getName();
			} else {
				name = '' + torrents.length + ' Transfers Selected';
			}
			setTextContent(e.name_lb, name || na);

			// update the visible page
			if ($(e.info_page).is(':visible')) {
				updateInfoPage();
			} else if ($(e.peers_page).is(':visible')) {
				updatePeersPage();
			} else if ($(e.trackers_page).is(':visible')) {
				updateTrackersPage();
			} else if ($(e.files_page).is(':visible')) {
				updateFilesPage();
			}
		},

		/****
		 *****  GENERAL INFO PAGE
		 ****/

		updateInfoPage = function () {
			var torrents = data.torrents,
				e = data.elements,
				fmt = Transmission.fmt,
				none = 'None',
				never = 'Never',
				mixed = 'Mixed',
				unknown = 'Unknown',
				active = 'Active Now',
				unavailable = 'Unavailable',
				isMixed, allPaused, allFinished,
				str, added = 0,
				baseline, it, s, i, t,
				sizeWhenDone = 0,
				leftUntilDone = 0,
				available = 0,
				haveVerified = 0,
				haveUnverified = 0,
				verifiedPieces = 0,
				stateString,
				latest,
				pieces,
				size,
				pieceSize,
				creator, mixed_creator,
				date, mixed_date,
				v, u, f, d, pct,
				uri,
				now = Date.now();

			//
			//  None Selected
			//

			if (torrents.length < 1) {
			   str = none;
			   setTextContent(e.state_lb, str);
			   setTextContent(e.have_lb, str);
			   setTextContent(e.downloaded_lb, str);
			   setTextContent(e.availability_lb, str);
			   setTextContent(e.uploaded_lb, str);
			   setTextContent(e.running_time_lb, str);
			   setTextContent(e.remaining_time_lb, str);
			   setTextContent(e.last_activity_lb, str);
			   setTextContent(e.age_lb, str);
			   setTextContent(e.dadd_lb, str);
			   setTextContent(e.error_lb, str);
			   setTextContent(e.size_lb, str);
			   setTextContent(e.hash_lb, str);
			   setTextContent(e.privacy_lb, str);
			   setTextContent(e.comment_lb, str);
			   setTextContent(e.origin_lb, str);
			   setTextContent(e.foldername_lb, str);
			} else {

				//
				//  state_lb
				//

				isMixed = false;
				allPaused = true;
				allFinished = true;

				baseline = torrents[0].getStatus();
				for (i = 0; t = torrents[i]; ++i) {
					it = t.getStatus();
					if (it != baseline) {
						isMixed = true;
					}
					if (!t.isStopped()) {
						allPaused = allFinished = false;
					}
					if (!t.isFinished()) {
						allFinished = false;
					}
				}
				if (isMixed) {
					str = mixed;
				} else if (allFinished) {
					str = 'Finished';
				} else if (allPaused) {
					str = 'Paused';
				} else {
					str = torrents[0].getStateString();
				}

			   setTextContent(e.state_lb, str);

				//
				//  have_lb
				//

				baseline = torrents[0].getStatus();
				for (i = 0; t = torrents[i]; ++i) {
					if (!t.needsMetaData()) {
						haveUnverified += t.getHaveUnchecked();
						v = t.getHaveValid();
						haveVerified += v;
						if (t.getPieceSize()) {
							verifiedPieces += v / t.getPieceSize();
						}
						sizeWhenDone += t.getSizeWhenDone();
						leftUntilDone += t.getLeftUntilDone();
						available += (t.getHave()) + t.getDesiredAvailable();
					}
				}

				d = 100.0 * (sizeWhenDone ? (sizeWhenDone - leftUntilDone) / sizeWhenDone : 1);
				str = fmt.percentString(d);

				if (!haveUnverified && !leftUntilDone) {
					str = fmt.size(haveVerified) + ' (100%)';
				} else if (!haveUnverified) {
					str = fmt.size(haveVerified) + ' of ' + fmt.size(sizeWhenDone) + ' (' + str + '%)';
				} else {
					str = fmt.size(haveVerified) + ' of ' + fmt.size(sizeWhenDone) + ' (' + str + '%), ' + fmt.size(haveUnverified) + ' Unverified';
				}

			   setTextContent(e.have_lb, str);

				//
				//  availability_lb
				//

				if (sizeWhenDone == 0) {
					str = none;
				} else {
					str = '' + fmt.percentString((100.0 * available) / sizeWhenDone) + '%';
				};

				setTextContent(e.availability_lb, str);

				//
				//  downloaded_lb
				//

				d = f = 0;
				for (i = 0; t = torrents[i]; ++i) {
					d += t.getDownloadedEver();
					f += t.getFailedEver();
				};
				if (f) {
					str = fmt.size(d) + ' (' + fmt.size(f) + ' corrupt)';
				} else {
					str = fmt.size(d);
				};

				setTextContent(e.downloaded_lb, str);

				//
				//  uploaded_lb
				//

				d = u = 0;
				if (torrents.length == 1) {
					d = torrents[0].getDownloadedEver();
					u = torrents[0].getUploadedEver();

					if (d == 0) {
						d = torrents[0].getHaveValid();
					};
				} else {
					for (i = 0; t = torrents[i]; ++i) {
						d += t.getDownloadedEver();
						u += t.getUploadedEver();
					};
				};

				str = fmt.size(u) + ' (Ratio: ' + fmt.ratioString(Math.ratio(u, d)) + ')';

				setTextContent(e.uploaded_lb, str);

				//
				// running time
				//

				added = torrents[0].getDateAdded();
				baseline = torrents[0].getStartDate();
				for (i = 0; t = torrents[i]; ++i) {
					if (!baseline) {
						if (added != t.getDateAdded()) {
							baseline = -1;
							break;
						}
					} else {
						if (baseline != t.getStartDate()) {
							baseline = -1;
							break;
						}
					}
				}

				if (!baseline) {
					str = never;
				} else if (baseline < 0) {
					str = mixed;
				} else {
					str = fmt.timeInterval(now / 1000 - baseline);
				}

				setTextContent(e.running_time_lb, str);

				//
				// remaining time
				//

				str = '';
				baseline = torrents[0].getETA();
				var have = torrents[0].getHave();
				var size = torrents[0].getTotalSize();
				var peers = torrents[0].getDesiredAvailable() || 0; 

				for (i = 0; t = torrents[i]; ++i) {
					if (size != t.getTotalSize()) {
						str = mixed;
						break;
					}
					if (baseline != t.getETA()) {
						str = mixed;
						break;
					}
				}

				var available = have + peers; 

				if (!str.length) {
					if (available < size) {
						str = unavailable;
					} else if (baseline < 0) {
						str = unknown;
					} else if (baseline < 5) {
						str = none;
					} else {
						str = fmt.timeInterval(baseline);
					}
				}

				setTextContent(e.remaining_time_lb, str);

				//
				// last activity
				//

				latest = torrents[0].getLastActivity();
				d = now / 1000 - latest; // Seconds since last activity

				if (d < 0) {
					str = none;
				} else if (d < 5) {
					str = active;
				} else if (latest < 1) {
					str = never;
				} else {
					str = fmt.timeInterval(d) + ' ago';
				};

				for (i = 0; t = torrents[i]; ++i) {
					if (latest != t.getLastActivity()) {
						str = mixed;
						break;
					};
				};

				setTextContent(e.last_activity_lb, str);

				//
				// age
				//

				added = torrents[0].getDateAdded();
				str = fmt.timeInterval(now / 1000 - added);
				for (i = 0; t = torrents[i]; ++i) {
					if (added != t.getDateAdded()) {
						str = mixed;
						break;
					};
				};

				setTextContent(e.age_lb, str || none);


				//
				// date added
				//

				addeddate = torrents[0].getDateAdded();
				str = fmt.timestamp(addeddate);
				for (i = 0; t = torrents[i]; ++i) {
					if (added != t.getDateAdded()) {
						str = mixed;
						break;
					};
				};

				setTextContent(e.dadd_lb, str || none);


				//
				// error
				//

				str = torrents[0].getErrorString();
				for (i = 0; t = torrents[i]; ++i) {
					if (str != t.getErrorString()) {
						str = mixed;
						break;
					};
				};

				setTextContent(e.error_lb, str || none);

				//
				// size
				//

				pieces = 0;
				size = 0;
				pieceSize = torrents[0].getPieceSize();
				for (i = 0; t = torrents[i]; ++i) {
					pieces += t.getPieceCount();
					size += t.getTotalSize();
					if (pieceSize != t.getPieceSize()) {
						pieceSize = 0;
					}
				};
				if (!size) {
					str = none;
				} else if (pieceSize > 0) {
					str = fmt.size(size) + ' (' + pieces.toStringWithCommas() + ' pieces @ ' + fmt.mem(pieceSize) + ')';
				} else {
					str = fmt.size(size) + ' (' + pieces.toStringWithCommas() + ' pieces)';
				};

			   setTextContent(e.size_lb, str);

				//
				//  hash
				//

				str = torrents[0].getHashString();
				for (i = 0; t = torrents[i]; ++i) {
					if (str != t.getHashString()) {
						str = mixed;
						break;
					};
				};

				setTextContent(e.hash_lb, str);

				//
				//  privacy
				//

				baseline = torrents[0].getPrivateFlag();
				str = baseline ? 'Private Torrent, DHT and PEX Disabled' : 'Public Torrent';
				for (i = 0; t = torrents[i]; ++i) {
					if (baseline != t.getPrivateFlag()) {
						str = mixed;
						break;
					};
				};

				setTextContent(e.privacy_lb, str);

				//
				//  comment
				//

				str = torrents[0].getComment();
				for (i = 0; t = torrents[i]; ++i) {
					if (str != t.getComment()) {
						str = mixed;
						break;
					};
				};

				if (!str) {
					str = none;
				}

				// URL Disabled, This seems dangerous .....
//				uri = parseUri(str);
//				if (uri.protocol == 'http' || uri.protocol == 'https') {
//					str = encodeURI(str);
//					setInnerHTML(e.comment_lb, '<a href="' + str + '" target="_blank" >' + str + '</a>');
//				} else {
					setTextContent(e.comment_lb, str);
//				};

				//
				//  origin
				//

				mixed_creator = false;
				mixed_date = false;
				creator = torrents[0].getCreator();
				date = torrents[0].getDateCreated();
				for (i = 0; t = torrents[i]; ++i) {
					if (creator != t.getCreator()) {
						mixed_creator = true;
					};
					if (date != t.getDateCreated()) {
						mixed_date = true;
					};
				};
				var empty_creator = !creator || !creator.length;
				var empty_date = !date;
				if (mixed_creator || mixed_date) {
					str = mixed;
				} else if (empty_creator && empty_date) {
					str = unknown;
				} else if (empty_date && !empty_creator) {
					str = 'Created by ' + creator;
				} else if (empty_creator && !empty_date) {
					str = 'Created on ' + (new Date(date * 1000)).toDateString();
				} else {
					str = 'Created by ' + creator + ' on ' + (new Date(date * 1000)).toDateString();
				};

				setTextContent(e.origin_lb, str);

				//
				//  foldername
				//

				str = torrents[0].getDownloadDir();
				for (i = 0; t = torrents[i]; ++i) {
					if (str != t.getDownloadDir()) {
						str = mixed;
						break;
					};
				};

				setTextContent(e.foldername_lb, str);

			}  // End of Info Page

		},


		/****
		 *****  FILES PAGE
		 ****/

		changeFileCommand = function (fileIndices, command) {
			var torrentId = data.file_torrent.getId();
			data.controller.changeFileCommand(torrentId, fileIndices, command);
		},

		onFileWantedToggled = function (ev, fileIndices, want) {
			changeFileCommand(fileIndices, want ? 'files-wanted' : 'files-unwanted');
		},

		onFilePriorityToggled = function (ev, fileIndices, priority) {
			var command;
			switch (priority) {
			case -1:
				command = 'priority-low';
				break;
			case 1:
				command = 'priority-high';
				break;
			default:
				command = 'priority-normal';
				break;
			}
			changeFileCommand(fileIndices, command);
		},

		onNameClicked = function (ev, fileRow, fileIndices) {
			$(fileRow.getElement()).siblings().slideToggle();
		},

		clearFileList = function () {
			$(data.elements.file_list).empty();
			delete data.file_torrent;
			delete data.file_torrent_n;
			delete data.file_rows;
		},

		createFileTreeModel = function (tor) {
			var i, j, n, name, tokens, walk, tree, token, sub,
				leaves = [],
				tree = {
					children: {},
					file_indices: []
				};

			n = tor.getFileCount();
			for (i = 0; i < n; ++i) {
				name = tor.getFile(i).name;
				tokens = name.split('/');
				walk = tree;
				for (j = 0; j < tokens.length; ++j) {
					token = tokens[j];
					sub = walk.children[token];
					if (!sub) {
						walk.children[token] = sub = {
							name: token,
							parent: walk,
							children: {},
							file_indices: [],
							depth: j
						};
					}
					walk = sub;
				}
				walk.file_index = i;
				delete walk.children;
				leaves.push(walk);
			}

			for (i = 0; i < leaves.length; ++i) {
				walk = leaves[i];
				j = walk.file_index;
				do {
					walk.file_indices.push(j);
					walk = walk.parent;
				} while (walk);
			}

			return tree;
		},

		addNodeToView = function (tor, parent, sub, i) {
			var row;
			row = new FileRow(tor, sub.depth, sub.name, sub.file_indices, i % 2);
			data.file_rows.push(row);
			parent.appendChild(row.getElement());
			$(row).bind('wantedToggled', onFileWantedToggled);
			$(row).bind('priorityToggled', onFilePriorityToggled);
			$(row).bind('nameClicked', onNameClicked);
		},

		addSubtreeToView = function (tor, parent, sub, i) {
			var key, div;
			div = document.createElement('div');
			if (sub.parent) {
				addNodeToView(tor, div, sub, i++);
			}
			if (sub.children) {
				for (key in sub.children) {
					i = addSubtreeToView(tor, div, sub.children[key]);
				}
			}
			parent.appendChild(div);
			return i;
		},

		updateFilesPage = function () {
			var i, n, tor, fragment, tree,
				file_list = data.elements.file_list,
				torrents = data.torrents;

			// only show one torrent at a time
			if (torrents.length !== 1) {
				clearFileList();
				return;
			}

			tor = torrents[0];
			n = tor ? tor.getFileCount() : 0;
			if (tor != data.file_torrent || n != data.file_torrent_n) {
				// rebuild the file list...
				clearFileList();
				data.file_torrent = tor;
				data.file_torrent_n = n;
				data.file_rows = [];
				fragment = document.createDocumentFragment();
				tree = createFileTreeModel(tor);
				addSubtreeToView(tor, fragment, tree, 0);
				file_list.appendChild(fragment);
			} else {
				// ...refresh the already-existing file list
				for (i = 0, n = data.file_rows.length; i < n; ++i)
					data.file_rows[i].refresh();
			}
		},

		/****
		 *****  PEERS PAGE
		 ****/

		updatePeersPage = function () {
			var i, k, tor, peers, peer, parity,
				html = [],
				fmt = Transmission.fmt,
				peers_list = data.elements.peers_list,
				torrents = data.torrents;

			for (k = 0; tor = torrents[k]; ++k) {
				peers = tor.getPeers();
				html.push('<div class="inspector_group">');
				if (torrents.length > 1) {
					html.push('<div class="inspector_torrent_label">', sanitizeText(tor.getName()), '</div>');
				}
				if (!peers || !peers.length) {
					html.push('<br></div>'); // firefox won't paint the top border if the div is empty
					continue;
				}
				html.push('<table class="peer_list">',
					'<tr class="inspector_peer_entry even">',
					'<th class="encryptedCol"></th>',
					'<th class="upCol">Up</th>',
					'<th class="downCol">Down</th>',
					'<th class="percentCol">%</th>',
					'<th class="statusCol">Status</th>',
					'<th class="addressCol">Address</th>',
					'<th class="clientCol">Client</th>',
					'</tr>');
				for (i = 0; peer = peers[i]; ++i) {
					parity = (i % 2) ? 'odd' : 'even';
					html.push('<tr class="inspector_peer_entry ', parity, '">',
						'<td>', (peer.isEncrypted ? '<div class="encrypted-peer-cell" title="Encrypted Connection">' : '<div class="unencrypted-peer-cell">'), '</div>', '</td>',
						'<td>', (peer.rateToPeer ? fmt.speedBps(peer.rateToPeer) : ''), '</td>',
						'<td>', (peer.rateToClient ? fmt.speedBps(peer.rateToClient) : ''), '</td>',
						'<td class="percentCol">', fmt.percentString(peer.progress * 100.0), '%', '</td>',
						'<td>', fmt.peerStatus(peer.flagStr), '</td>',
						'<td>', sanitizeText(peer.address), '</td>',
						'<td class="clientCol">', sanitizeText(peer.clientName), '</td>',
						'</tr>');
				}
				html.push('</table></div>');
			}

			setInnerHTML(peers_list, html.join(''));
		},

		/****
		 *****  TRACKERS PAGE
		 ****/

		getAnnounceState = function (tracker) {
			var timeUntilAnnounce, s = '';
			switch (tracker.announceState) {
			case Torrent._TrackerActive:
				c = 'green';
				s = 'Announce in progress';
				break;
			case Torrent._TrackerWaiting:
				timeUntilAnnounce = tracker.nextAnnounceTime - ((new Date()).getTime() / 1000);
				if (timeUntilAnnounce < 0) {
					timeUntilAnnounce = 0;
				}
				c = 'darkgreen';
				s = 'Next announce: ' + Transmission.fmt.timeInterval(timeUntilAnnounce);
				break;
			case Torrent._TrackerQueued:
				c = 'purple';
				s = 'Announce is queued';
				break;
			case Torrent._TrackerInactive:
				c = 'grey';
				s = tracker.isBackup ?
					'Tracker will be used as a backup' :
					'Announce not scheduled';
				break;
			default:
				c = 'red';
				s = 'Unknown announce state: ' + tracker.announceState;
			}
			return {
				'value': s,
				'color': c
			};
		},

		lastAnnounceStatus = function (tracker) {

			var lastAnnounceLabel = 'Last Announce',
				lastAnnounce = ['N/A'],
				lastAnnounceTime;

			if (tracker.hasAnnounced) {
				lastAnnounceTime = Transmission.fmt.timestamp(tracker.lastAnnounceTime);
				if (tracker.lastAnnounceSucceeded) {
					lastAnnounce = [lastAnnounceTime, ' (got ', Transmission.fmt.countString('peer', 'peers', tracker.lastAnnouncePeerCount), ')'];
				} else {
					lastAnnounceLabel = 'Announce error';
					lastAnnounce = [(tracker.lastAnnounceResult ? (tracker.lastAnnounceResult + ' - ') : ''), lastAnnounceTime];
				}
			}
			return {
				'label': lastAnnounceLabel,
				'value': lastAnnounce.join('')
			};
		},

		lastScrapeStatus = function (tracker) {

			var lastScrapeLabel = 'Last Scrape',
				lastScrape = 'N/A',
				lastScrapeTime;

			if (tracker.hasScraped) {
				lastScrapeTime = Transmission.fmt.timestamp(tracker.lastScrapeTime);
				if (tracker.lastScrapeSucceeded) {
					lastScrape = lastScrapeTime;
				} else {
					lastScrapeLabel = 'Scrape error';
					lastScrape = (tracker.lastScrapeResult ? tracker.lastScrapeResult + ' - ' : '') + lastScrapeTime;
				}
			}
			return {
				'label': lastScrapeLabel,
				'value': lastScrape
			};
		},

		updateTrackersPage = function () {
			var i, j, tier, tracker, trackers, tor,
				html, parity, lastAnnounceStatusHash,
				announceState, lastScrapeStatusHash,
				na = 'N/A',
				trackers_list = data.elements.trackers_list,
				torrents = data.torrents;

			// By building up the HTML as as string, then have the browser
			// turn this into a DOM tree, this is a fast operation.
			html = [];
			for (i = 0; tor = torrents[i]; ++i) {
				html.push('<div class="inspector_group">');

				if (torrents.length > 1) {
					html.push('<div class="inspector_torrent_label">', sanitizeText(tor.getName()), '</div>');
				}

				tier = -1;
				trackers = tor.getTrackers();
				for (j = 0; tracker = trackers[j]; ++j) {
					if (tier != tracker.tier) {
						if (tier !== -1) { // close previous tier
							html.push('</ul></div>');
						}

						tier = tracker.tier;

						html.push('<div class="inspector_group_label">',
							'Tier ', tier + 1, '</div>',
							'<ul class="tier_list">');
					}

					// Display construction
					if (tracker.hasAnnounced) {
						if (tracker.lastAnnounceSucceeded) {
							laColor = 'blue';
						} else {
							laColor = 'red';
						}
					} else {
						laColor = 'grey';
					};

					if (tracker.hasScraped) {
						if (tracker.lastScrapeSucceeded) {
							lsColor = 'purple';
						} else {
							lsColor = 'red';
						}
					} else {
						lsColor = 'grey';
					};

					announceState = getAnnounceState(tracker);
					anText = announceState['value'];
					anColor = announceState['color'];
					lastAnnounceStatusHash = lastAnnounceStatus(tracker);
					lastScrapeStatusHash = lastScrapeStatus(tracker);
					parity = (j % 2) ? 'odd' : 'even';
					html.push('<li class="inspector_tracker_entry ', parity, '"><div title="', sanitizeText(tracker.host || ''), '">',
						'<font color="brown">', sanitizeText(tracker.announce || ''), '</font></div>',
						'<div class="tracker_activity">',
						'<div><font color="'+laColor+'">', lastAnnounceStatusHash['label'], ': ', sanitizeText(lastAnnounceStatusHash['value']), '</font></div>',
						'<div><font color="'+anColor+'">', anText, '</font></div>',
						'<div><font color="'+lsColor+'">', lastScrapeStatusHash['label'], ': ', sanitizeText(lastScrapeStatusHash['value']), '</font></div>',
						'</div><table class="tracker_stats">',
						'<tr><th>Seeders:</th><td>', (tracker.seederCount > -1 ? tracker.seederCount : na), '</td></tr>',
						'<tr><th>Leechers:</th><td>', (tracker.leecherCount > -1 ? tracker.leecherCount : na), '</td></tr>',
						'<tr><th>Downloads:</th><td>', (tracker.downloadCount > -1 ? tracker.downloadCount : na), '</td></tr>',
						'</table></li>');
				}
				if (tier !== -1) { // close last tier
					html.push('</ul></div>');
				}

				html.push('</div>'); // inspector_group
			}

			setInnerHTML(trackers_list, html.join(''));
		},

		initialize = function (controller) {

			var ti = '#torrent_inspector_';

			data.controller = controller;

			$('.inspector-tab').click(onTabClicked);

			data.elements.info_page = $('#inspector-page-info')[0];
			data.elements.files_page = $('#inspector-page-files')[0];
			data.elements.peers_page = $('#inspector-page-peers')[0];
			data.elements.trackers_page = $('#inspector-page-trackers')[0];

			data.elements.file_list = $('#inspector_file_list')[0];
			data.elements.peers_list = $('#inspector_peers_list')[0];
			data.elements.trackers_list = $('#inspector_trackers_list')[0];

			data.elements.have_lb = $('#inspector-info-have')[0];
			data.elements.availability_lb = $('#inspector-info-availability')[0];
			data.elements.downloaded_lb = $('#inspector-info-downloaded')[0];
			data.elements.uploaded_lb = $('#inspector-info-uploaded')[0];
			data.elements.state_lb = $('#inspector-info-state')[0];
			data.elements.age_lb = $('#inspector-info-age')[0];
			data.elements.dadd_lb = $('#inspector-info-added')[0];
			data.elements.running_time_lb = $('#inspector-info-running-time')[0];
			data.elements.remaining_time_lb = $('#inspector-info-remaining-time')[0];
			data.elements.last_activity_lb = $('#inspector-info-last-activity')[0];
			data.elements.error_lb = $('#inspector-info-error')[0];
			data.elements.size_lb = $('#inspector-info-size')[0];
			data.elements.foldername_lb = $('#inspector-info-location')[0];
			data.elements.hash_lb = $('#inspector-info-hash')[0];
			data.elements.privacy_lb = $('#inspector-info-privacy')[0];
			data.elements.origin_lb = $('#inspector-info-origin')[0];
			data.elements.comment_lb = $('#inspector-info-comment')[0];
			data.elements.name_lb = $('#torrent_inspector_name')[0];

			// force initial 'N/A' updates on all the pages
			updateInspector();
			updateInfoPage();
			updatePeersPage();
			updateTrackersPage();
			updateFilesPage();
		};

	/****
	 *****  PUBLIC FUNCTIONS
	 ****/

	this.setTorrents = function (torrents) {
		var d = data,
			that = this;

		// update the inspector when a selected torrent's data changes.
		$(d.torrents).unbind('dataChanged.inspector');
		$(torrents).bind('dataChanged.inspector', $.proxy(updateInspector, this));
		d.torrents = torrents;

		// periodically ask for updates to the inspector's torrents
		clearTimeout(d.refreshTimeout);

		function callback() {
			refreshTorrents(rescheduleTimeout);
		}

		function rescheduleTimeout() {
			d.refreshTimeout = setTimeout(callback, 2000);
		}

		rescheduleTimeout();
		refreshTorrents();

		// refresh the inspector's UI
		updateInspector();
	};

	initialize(controller);
};
