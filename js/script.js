
var userName = "Sreekumar";
window.addEventListener("load", function () {
    $(".exType").mouseenter(function (e) {
        var id = e.target.id + "Demo";
        console.log("Showing " + id);
        $("#" + id).css("z-index", 200).css("display", "block").show();
    });

    $(".exType").mouseleave(function (e) {
        var id = e.target.id + "Demo";
        console.log("Hiding " + id);
        $("#" + id).css("z-index", 1).css("display", "none").hide();
    });

    $("#startDayButton").click(function () {
        FitnessApp.init();
    });
    $("#quitButton").click(function () {
        console.log("quitting");
        FitnessApp.quit();
    });
    $("#shareButton").click(function() {
        console.log("Share clicked.");
        if (navigator.share) {
          navigator.share({
            title: 'Fitness++ during WFH',
            url: 'https://codemarvels.com/fit4wfh/'
          }).then(() => {
            console.log('Thanks for sharing!');
          }).catch(console.error);
        } else {
            console.log('Share not supported in browser.');
        }
    });

    $("#share").jsSocials({
        shares: ["email", "twitter", "facebook", "linkedin", "pinterest", "stumbleupon", "whatsapp"]
    });
    if ('speechSynthesis' in window) {
        var voices = window.speechSynthesis.getVoices();
        console.log("voices : " + voices);
    }

    var exercisesStored = localStorage.getItem("exercisesStored");
    if (exercisesStored) {
        var prevExercises = JSON.parse(exercisesStored);
        $("input[type='checkbox']").each(function () {
            var wasSelected = false;
            for (ex in prevExercises) {
                if (prevExercises[ex] == this.value) {
                    wasSelected = true;
                    break;
                }
            }
            if (!wasSelected) {
                this.checked = false;
            }
        });
    }

    var prevName = localStorage.getItem("firstName");
    if (prevName) {
        $("#userNameInput").val(prevName);
    }
    

    Notification.requestPermission().then(function (permission) {
        console.log(permission);
    });

});

var FitnessApp = {

    lastState: false,
    nextWorkOutTime: new Date(),
    selectedExercises: [],
    exeIndex: 0,
    exerciseMinute: 53,

    init: function () {
        var self = this;

        if ($("#userNameInput").val() == '') {
            $("#userNameDiv").effect("shake");
            return;
        }

        userName = $("#userNameInput").val().trim();
        self.selectedExercises = [];
        $("input[type='checkbox']:checked").each(function () {
            console.log("checked : " + this.value);
            self.selectedExercises.push(this.value);
        });

        
        

        self.exercisesDescription = "";
        if (self.selectedExercises.length > 0) {
            for (ex in self.selectedExercises) {
                if (self.exercisesDescription.length > 0) {
                    if (ex < self.selectedExercises.length - 1) {
                        self.exercisesDescription += ", ";
                    } else {
                        self.exercisesDescription += " and ";
                    }
                    
                }
                self.exercisesDescription += self.selectedExercises[ex];
            }    
        }


        if (self.selectedExercises.length == 0) {
            $("#exercisesDiv").effect("shake");
            return;
        }

        $("#userIsPresentButton").click(function () {
            self.showState("checkIfFree");
            self.exeIndex = (self.exeIndex + 1) % self.selectedExercises.length;
        });
        $("#exerciseStartedButton").click(function () {
            self.showState("startExerciseResponse");
        });
        $("#userNotFreeButton").click(function () {
            self.showState("noExerciseResponse");
        });
        $("#exerciseFinishedButton").click(function () {
            self.showState("congratulateCompletion");
        });
        $("#waitForNextTurnButton").click(function () {
            self.showState("focusOnWork", true);
        });
        $("#returnAfterExerciseButton").click(function () {
            self.showState("focusOnWork", true);
        });

        localStorage.setItem("firstName", userName);
        localStorage.setItem("exercisesStored", JSON.stringify(self.selectedExercises));

        $("#initiation").hide();
        $("#workoutSchedule").show();

        this.showState("shallRemind");
        self.startReminder();

        self.initTransitionTimeOutHandle = setTimeout(function () {

            self.showState("focusOnWork", true);
        }, 20000);
    },

    startReminder: function (runNow) {

        var exerciseMinute = this.exerciseMinute;
        var now = new Date();
        var nextTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), exerciseMinute, 0, 0);
        if (nextTime - now < 100) {
            nextTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), (now.getHours() + 1), exerciseMinute, 0, 0);
        }
        var e = nextTime - now;
        this.nextWorkOutTime = nextTime;
        this.timeOutHandle = window.setTimeout(function () {
            FitnessApp.startReminder(true);
        }, e);
        console.log("Next work out scheduled at " + nextTime);
        if (!runNow) {
            return;
        }

        if (this.initTransitionTimeOutHandle) {
            clearTimeout(this.initTransitionTimeOutHandle);
            this.initTransitionTimeOutHandle = false;
        }

        this.showState("startReminder");

    },

    showState: function (stateName, mute) {
        var panel = $("#" + stateName);
        var messages = this.messages[stateName + "Screen"];
        if (messages && messages.length > 0) {
            var randomIndex = Math.floor(Math.random() * messages.length);
            var mainMessage = messages[randomIndex];
            var exercise = this.exercisePhrase(this.selectedExercises[this.exeIndex]);
            
            mainMessage = mainMessage.replace("{userName}", userName);
            mainMessage = mainMessage.replace("{exercise}", exercise);
            mainMessage = mainMessage.replace("{exercises}", this.exercisesDescription);

            if (!mute) {
                this.speakAloud(mainMessage);
            }
            panel.find(".heading-section").first().html(mainMessage);
            if (stateName == "startReminder") {
                setTimeout(function() {
                    FitnessApp.showNotification(mainMessage);
                }, 200);
            }
        }

        var appends = this.appends[stateName + "Screen"];

        if (appends && appends.length > 0) {

            panel.find(".append").first().html("");
            setTimeout(function () {
                randomIndex = Math.floor(Math.random() * appends.length);
                var appendMessage = appends[randomIndex];
                var date = FitnessApp.nextWorkOutTime;
                var time = date.toLocaleTimeString();
                appendMessage = appendMessage.replace("{time}", time);
                if (!mute) {
                    FitnessApp.speakAloud(appendMessage);
                }
                panel.find(".append").first().html(appendMessage);
            }, 2000);

        }
        if (this.lastState) {
            var lastPanel = $("#" + this.lastState);
            lastPanel.hide();
        }
        panel.show();
        this.lastState = stateName;
    },

    speakAloud: function (text) {
        if ('speechSynthesis' in window) {
            var msg = new SpeechSynthesisUtterance();


            if (!this.googleVoice) {
                var voices = window.speechSynthesis.getVoices();
                for (i in voices) {
                    var voice = voices[i];
                    if (voice.lang.includes("en-") && voice.name.includes("Male")) {
                        this.googleVoice = voice;
                        break;
                    }
                }
                console.log(voices);
                console.log(this.googleVoice);
            }

            msg.voice = this.googleVoice; // Note: some voices don't support altering params
            msg.voiceURI = 'native';
            /*msg.volume = 1; // 0 to 1
            msg.rate = 1; // 0.1 to 10
            msg.pitch = 2; //0 to 2*/
            msg.text = text;
            msg.lang = 'en-IN';

            msg.onend = function (e) {
                console.log('Finished in ' + e.elapsedTime + ' seconds.');
            };

            speechSynthesis.speak(msg);
            console.log('spoke: ' + text);
        }
    },

    showNotification: function (text) {

        if (document.visibilityState === "visible") {
            //return;
        }
        var title = "WFH Fitness";
        var icon = "img/cm.svg";

        if (Notification.permission == "granted") {

            var notification = new Notification(title, {
                body: text,
                icon: icon,
                requireInteraction : true
             });
            notification.onclick = function () {
                notification.close();
                window.parent.focus();
            };

        } else if (Notification.permission == 'denied' || Notification.permission === "default") {
            
            console.log("Permission is %s . Trying again.", Notification.permission);
            Notification.requestPermission(function (permission) {
                
                // If the user accepts, let's create a notification
                if (permission === "granted") {
                    try {
                        notification = new Notification(title, { body: text, icon: icon });
                        notification.onclick = function () {
                            notification.close();
                            window.parent.focus();
                        };
                    } catch(error) {
                        console.error(error);
                    }
                    
                } else {
                    console.log("Permission is still %s", permission);
                }

            });
        }

    },

    exercisePhrase: function (exercise) {
        switch (exercise) {
            case "burpees": return "Burpees";
            case "lunges": return "Lunges";
            case "pushups": return "Push Ups";
            case "squats": return "Squats";
            case "plank": return "full breaths long Plank";
        }
        return "";
    },

    quit: function () {
        if (this.timeOutHandle) {
            clearTimeout(this.timeOutHandle);
        }
        if (this.initTransitionTimeOutHandle) {
            clearTimeout(this.initTransitionTimeOutHandle);
        }
        this.showState("byeBye");
        window.speechSynthesis.cancel();

    },

    messages: {
        shallRemindScreen: [
            "Cool! You have chosen to do {exercises}. {userName}, I shall remind you to do one of your chosen exercises during the tail end of every hour!",
            "Sure! You have chosen {exercises}. {userName}, Lets steal few minutes from the last part of every hour to do these quick workouts!",
            "Nice! You chose {exercises}. {userName}, I will try to get our exercises done in last 8 minutes of every hour.",
            "Good! Today you will be doing {exercises}. {userName}, Lets do these workouts every hour. I will remind you towards the end of each hour."
        ],
        startReminderScreen: [
            "Hi {userName}, this is your WFH Fitness coach !",
            "Hey {userName}, your Fitness coach here!",
            "Hello {userName}, I'm back here, you fitness coach!",
            "Knock knock ! {userName}, your fitness coach calling !"
        ],
        checkIfFreeScreen: [
            "Will you be free now to do 10 to 20 {exercise} ?",
            "Can you do 10 to 20 {exercise} now ?",
            "Let's do 10 to 20 {exercise} now ?",
            "Do that 10 to 20 {exercise} right away ?"
        ],
        startExerciseResponseScreen: [
            "Great. Just click on ' I'm Done ' button after you have finished. Lets start !",
            "Cool. After finishing just click on 'I'm Done' button. Go ahead, kill it",
            "Now thats {userName}! Just remember to click 'I'm Done' once you finish. Get set go!",
            "Super ! Once you are done remember to click the below button. Now go finish it!"
        ],
        noExerciseResponseScreen: [
            "No problem. Let me remind you next hour.",
            "No worries. I will remind you again in an hour",
            "O.K. I will prompt you again next hour",
            "I see. Alright, let me remind you after an hour"
        ],
        congratulateCompletionScreen: [
            "Excellent {userName}. You are sculpting you body ! Let me remind you again next hour!",
            "Wow ! You are on your way to becoming Super {userName}. Good, I shall be back next hour!",
            "Awesome ! That was a {userName}++ step indeed ! I shall prompt you again next hour!",
            "You are great ! You are fitter than your previous self! Lets do it again in an hour !"
        ],
        focusOnWorkScreen: [
            "Ignore the noise. Focus on  your work.",
            "You can get what you focus on. So focus on what you want.",
            "Focus on the outcome, not the obstacle",
            "Where the focus goes, there the energy flows",
            "Starve you distractions. Feed your focus",
            "You focus determines your reality",
            "Stay focused",
            "All successful warriors have laser like Focus",
            "Focus on actions that produce results",
            "Focus on your strengths, not your weaknesses. Focus on your character, not your reputation. Focus on your blessings.",
            "Get it done. Focus.",
            "Success = Focused work",
            "Hustle. Show them the results.",
            "Contentment increases with each hour of focussed work"

        ]

    },
    appends: {
        shallRemindScreen: [
            "You can leave this screen ON and begin your day's work. I shall remind you when its time!",
            "Now you can keep this screen running and start off your work day. I shall call you just when it's time for an exercise break !"
        ],
        focusOnWorkScreen: [
            "Next WorkOut break scheduled at {time}. Please leave this screen running."
        ]
    }

}



