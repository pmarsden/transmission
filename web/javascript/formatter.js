/**
 * Copyright © Mnemosyne LLC
 *
 * This file is licensed under the GPLv2.
 * http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 */

Transmission.fmt = (function () {
	var speed_K = 1000;
	var speed_B_str = 'B/s';
	var speed_K_str = 'kB/s';
	var speed_M_str = 'MB/s';
	var speed_G_str = 'GB/s';
	var speed_T_str = 'TB/s';

	var size_K = 1000;
	var size_B_str = 'B';
	var size_K_str = 'kB';
	var size_M_str = 'MB';
	var size_G_str = 'GB';
	var size_T_str = 'TB';

	var mem_K = 1024;
	var mem_B_str = 'B';
	var mem_K_str = 'KiB';
	var mem_M_str = 'MiB';
	var mem_G_str = 'GiB';
	var mem_T_str = 'TiB';

	return {

		/*
		 *   Format a percentage to a string
		 */
		percentString: function (x) {
			if (x < 10.0) {
				return x.toTruncFixed(2);
			} else if (x < 100.0) {
				return x.toTruncFixed(1);
			} else {
				return x.toTruncFixed(0);
			}
		},

		/*
		 *   Format a ratio to a string
		 */
		ratioString: function (x) {
			if (x === -1) {
				return "None";
			}
			if (x === -2) {
				return '&infin;';
			}
			return this.percentString(x);
		},

		/**
		 * Formats the a memory size into a human-readable string
		 * @param {Number} bytes the filesize in bytes
		 * @return {String} human-readable string
		 */
		mem: function (bytes) {
			if (bytes < mem_K)
				return [bytes, mem_B_str].join(' ');

			var convertedSize;
			var unit;

			if (bytes < Math.pow(mem_K, 2)) {
				convertedSize = bytes / mem_K;
				unit = mem_K_str;
			} else if (bytes < Math.pow(mem_K, 3)) {
				convertedSize = bytes / Math.pow(mem_K, 2);
				unit = mem_M_str;
			} else if (bytes < Math.pow(mem_K, 4)) {
				convertedSize = bytes / Math.pow(mem_K, 3);
				unit = mem_G_str;
			} else {
				convertedSize = bytes / Math.pow(mem_K, 4);
				unit = mem_T_str;
			}

			// try to have at least 3 digits and at least 1 decimal
			return convertedSize <= 9.995 ? [convertedSize.toTruncFixed(2), unit].join(' ') : [convertedSize.toTruncFixed(1), unit].join(' ');
		},

		/**
		 * Formats the a disk capacity or file size into a human-readable string
		 * @param {Number} bytes the filesize in bytes
		 * @return {String} human-readable string
		 */
		size: function (bytes) {
			if (bytes < size_K) {
				return [bytes, size_B_str].join(' ');
			}

			var convertedSize;
			var unit;

			if (bytes < Math.pow(size_K, 2)) {
				convertedSize = bytes / size_K;
				unit = size_K_str;
			} else if (bytes < Math.pow(size_K, 3)) {
				convertedSize = bytes / Math.pow(size_K, 2);
				unit = size_M_str;
			} else if (bytes < Math.pow(size_K, 4)) {
				convertedSize = bytes / Math.pow(size_K, 3);
				unit = size_G_str;
			} else {
				convertedSize = bytes / Math.pow(size_K, 4);
				unit = size_T_str;
			}

			// try to have at least 3 digits and at least 1 decimal
			return convertedSize <= 9.995 ? [convertedSize.toTruncFixed(2), unit].join(' ') : [convertedSize.toTruncFixed(1), unit].join(' ');
		},

		speedBps: function (Bps) {
			return this.speed(this.toKBps(Bps));
		},

		toKBps: function (Bps) {
			return Math.floor(Bps / speed_K);
		},

		speed: function (KBps) {
			var speed = KBps;

			if (speed <= 999.95) { // 0 KBps to 999 K
				return [speed.toTruncFixed(0), speed_K_str].join(' ');
			}

			speed /= speed_K;

			if (speed <= 99.995) { // 1 M to 99.99 M
				return [speed.toTruncFixed(2), speed_M_str].join(' ');
			}
			if (speed <= 999.95) { // 100 M to 999.9 M
				return [speed.toTruncFixed(1), speed_M_str].join(' ');
			}

			// insane speeds
			speed /= speed_K;
			return [speed.toTruncFixed(2), speed_G_str].join(' ');
		},

		timeInterval: function (seconds) {
			var secs = Math.floor(seconds % 60),
				weeks = Math.floor(seconds / 604800),
				minutes = Math.floor((seconds % 3600) / 60),
				hours = Math.floor((seconds % 86400) / 3600),
				days = Math.floor((seconds % 604800) / 86400),
				years = Math.floor(seconds / 31556952), 
				d = days + ' ' + (days > 1 ? 'Days' : 'Day'),
				y = years + ' ' + (years > 1 ? 'Years' : 'Year'),
				h = hours + ' ' + (hours > 1 ? 'Hours' : 'Hour'),
				w = weeks + ' ' + (weeks > 1 ? 'Weeks' : 'Week'),
				s = secs + ' ' + (secs > 1 ? 'Seconds' : 'Second'),
				m = minutes + ' ' + (minutes > 1 ? 'Minutes' : 'Minute');

			if (years) {
				secondz = seconds - (years * 31556952);
				var secs = Math.floor(secondz % 60),
					weeks = Math.floor(secondz / 604800),
					minutes = Math.floor((secondz % 3600) / 60),
					hours = Math.floor((secondz % 86400) / 3600),
					days = Math.floor((secondz % 604800) / 86400),
					d = days + ' ' + (days > 1 ? 'Days' : 'Day'),
					y = years + ' ' + (years > 1 ? 'Years' : 'Year'),
					h = hours + ' ' + (hours > 1 ? 'Hours' : 'Hour'),
					w = weeks + ' ' + (weeks > 1 ? 'Weeks' : 'Week'),
					s = secs + ' ' + (secs > 1 ? 'Seconds' : 'Second'),
					m = minutes + ' ' + (minutes > 1 ? 'Minutes' : 'Minute');

				if (weeks) {
					return y + ', ' + w;
				}

				if (days) {
					return y + ', ' + d;
				}

				if (hours) {
					return y + ', ' + h;
				}

				if (minutes) {
					return y + ', ' + m;
				}

				return y + ', ' + s;
			}

			if (weeks) {
				return w + ', ' + d;
			}

			if (days) {
				return d + ', ' + h;
			}

			if (hours) {
				return h + ', ' + m;
			}

			if (minutes) {
				return m + ', ' + s;
			}

			return s;
		},

		timestamp: function (seconds) {
			if (!seconds) {
				return 'N/A';
			}

			var myDate = new Date(seconds * 1000);
			var now = new Date();

			var date = "";
			var time = "";
			var period = "";

			var sameYear = now.getFullYear() === myDate.getFullYear();
			var sameMonth = now.getMonth() === myDate.getMonth();

			var dateDiff = now.getDate() - myDate.getDate();
			if (sameYear && sameMonth && Math.abs(dateDiff) <= 1) {
				if (dateDiff === 0) {
					date = "Today";
				} else if (dateDiff === 1) {
					date = "Yesterday";
				} else {
					date = "Tomorrow"; // ??
				}
			} else {
				date = myDate.toDateString();
			}

			var hours = myDate.getHours();
//			var period = "AM";
//			if (hours > 12) {
//				hours = hours - 12;
//				period = "PM";
//			}
			if (hours === 0) {
				hours = 12;
			}
			if (hours < 10) {
				hours = "0" + hours;
			}
			var minutes = myDate.getMinutes();
			if (minutes < 10) {
				minutes = "0" + minutes;
			}
			var seconds = myDate.getSeconds();
			if (seconds < 10) {
				seconds = "0" + seconds;
			}

			time = [hours, minutes, seconds].join(':');

			return [date, time, period].join(' ');
		},

		ngettext: function (msgid, msgid_plural, n) {
			// TODO(i18n): http://doc.qt.digia.com/4.6/i18n-plural-rules.html
			return n === 1 ? msgid : msgid_plural;
		},

		countString: function (msgid, msgid_plural, n) {
			return [n.toStringWithCommas(), this.ngettext(msgid, msgid_plural, n)].join(' ');
		},

		peerStatus: function (flagStr) {
			var formattedFlags = [];
			for (var i = 0, flag; flag = flagStr[i]; ++i) {
				var explanation = null;
				switch (flag) {
				case "O":
					explanation = "Optimistic unchoke";
					break;
				case "D":
					explanation = "Downloading from this peer";
					break;
				case "d":
					explanation = "We would download from this peer if they'd let us";
					break;
				case "U":
					explanation = "Uploading to peer";
					break;
				case "u":
					explanation = "We would upload to this peer if they'd ask";
					break;
				case "K":
					explanation = "Peer has unchoked us, but we're not interested";
					break;
				case "?":
					explanation = "We unchoked this peer, but they're not interested";
					break;
				case "E":
					explanation = "Encrypted Connection";
					break;
				case "H":
					explanation = "Peer was discovered through Distributed Hash Table (DHT)";
					break;
				case "X":
					explanation = "Peer was discovered through Peer Exchange (PEX)";
					break;
				case "I":
					explanation = "Peer is an incoming connection";
					break;
				case "T":
					explanation = "Peer is connected via uTP";
					break;
				};

				if (!explanation) {
					formattedFlags.push(flag);
				} else {
					formattedFlags.push("<span title=\"" + flag + ': ' + explanation + "\">" + flag + "</span>");
				};
			};

			return formattedFlags.join('');
		}
	}
})();
