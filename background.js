/*eslint-disable*/
let adhanAudio;

let doaaAudio;

const getTranslatedMessage = function (label, language) {
  if (label) {
    if (language === 'ar') {
      return `حان وقت صلاة ${label} 🕌`;
    }

    return `It's ${label} time 🕌`;
  }
  else {
    if (language === 'ar') {
      return `حان وقت الصلاة  🕌`;
    }

    return `It's prayer time 🕌`;
  }
}

const fetchUserData = function () {
  const userData = JSON.parse(localStorage.getItem('userData'));

  return userData || false;
}

const playAdhan = function () {
  const userData = fetchUserData();
  const adhanAudioLevel = userData.adhanAudioLevel ?? 1;
  const shouldPlayAudio = userData && userData.selectedAdhanVoice !== 'no-audio';
  const shouldPlayDoaa = userData && userData.settings.playDoaaFlag !== false;

  if (shouldPlayAudio) {
    console.log('Play Audio');

    if (!adhanAudio || adhanAudio.paused) {
      adhanAudio = new Audio(`./data/adhan/${userData.selectedAdhanVoice}.mp3`);
      doaaAudio = new Audio("./data/adhan/sharawy_doaa.mp3");

      adhanAudio.volume = adhanAudioLevel;
      adhanAudio.play();
      adhanAudio.onended = function () {
        if (shouldPlayDoaa) {
          doaaAudio.volume = adhanAudioLevel;
          doaaAudio.play();
        }
      }
    }
  }
}

const stopAdhan = () => {
  console.log('Stop Audio');
  if (adhanAudio) {
    adhanAudio.pause();
    adhanAudio = null;
  }
}

const onCloseNotification = () => {
  console.log('Notification has been closed');
}

const shouldPlayAdhan = (scheduledTime) => {
  const alarmTime = new Date(scheduledTime);
  const currentTime = new Date();
  const MARGIN_TIME_IN_MINUTES = 5 * 60000;

  return (currentTime - alarmTime <= MARGIN_TIME_IN_MINUTES);
}

const shouldShowNotification = (scheduledTime) => {
  const alarmTime = new Date(scheduledTime);
  const currentTime = new Date();
  const MARGIN_TIME_IN_MINUTES = 5 * 60000;

  return (currentTime - alarmTime <= MARGIN_TIME_IN_MINUTES);
}

const createNotification = (message, isRequireInteraction) => {
  chrome.notifications.create('setPrayerAlarms', {
    type: 'basic',
    title: 'Quran Tab',
    message,
    requireInteraction: isRequireInteraction,
    iconUrl: 'icon.png'
  });
}

const fireAlarm = function (alarm) {
  const prayerKey = alarm.name;
  const userData = fetchUserData();

  if (userData) {
    const { settings, prayerTimesObject } = userData;
    const selectedLanguageKey = settings.selectedLanguageKey;
    const selectedLabel = selectedLanguageKey === 'ar' ? 'labelAr' : 'labelEn';
    const label = prayerTimesObject[prayerKey][selectedLabel];
    const message = getTranslatedMessage(label, selectedLanguageKey);

    if (shouldShowNotification(alarm.scheduledTime)) {
      createNotification(message, true);
      shouldPlayAdhan(alarm.scheduledTime) && playAdhan();
    }
  }
}

const clearPrayerAlarms = function () {
  chrome.alarms.clearAll();
};

const setPrayerAlarms = function (userData) {
  const prayerTimesObject = { ...userData.prayerTimesObject };

  if (prayerTimesObject) {
    clearPrayerAlarms();
    delete prayerTimesObject['sunrise'];
    Object.entries(prayerTimesObject)
          .forEach(function (item) {
            chrome.alarms.create(item[0], { when: item[1].timeValue });
          });
  }
}

const onReceiveMessage = function (request) {
  if (request.name === "setPrayerAlarms") {
    const userData = fetchUserData();

    if (userData && userData.settings.prayerTimesFlag !== false) {
      setPrayerAlarms(userData);
    }
  }
  else if (request.name === "clearPrayerAlarms") {
    clearPrayerAlarms();
  }
}

chrome.alarms.onAlarm.addListener(fireAlarm);

chrome.runtime.onMessage.addListener(onReceiveMessage);

chrome.notifications.onClicked.addListener(stopAdhan);

chrome.notifications.onClosed.addListener(stopAdhan);

chrome.runtime.setUninstallURL("https://docs.google.com/forms/d/e/1FAIpQLSfElqqIpzpJHEo6YNSHXLrTM5ESUGHm4L_CxHOf282hFNe56Q/viewform?hl=en");

// Standard Google Universal Analytics code
(function (i, s, o, g, r, a, m) {
  i['GoogleAnalyticsObject'] = r;
  i[r] = i[r] || function () {
    (i[r].q = i[r].q || []).push(arguments)
  }, i[r].l = 1 * new Date();
  a = s.createElement(o),
    m = s.getElementsByTagName(o)[0];
  a.async = 1;
  a.src = g;
  m.parentNode.insertBefore(a, m)
})(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga'); // Note: https protocol here

ga('create', 'UA-113590967-1', 'auto'); // Enter your GA identifier
ga('set', 'checkProtocolTask', function () {
}); // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
ga('require', 'displayfeatures');
ga('send', 'pageview', '/options.html'); // Specify the virtual path
