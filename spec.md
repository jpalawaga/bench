This brief serves as a design doc for an app/website used to movements during a workout.
Herein, any reference to 'app' may refer to an app in the sense of an Apple/Android based device,
or it may refer to a website opened in a tab on a phone browser.

The main app's functionality will be built around the core pices of a workout:
 - tracking which exercises are performed
 - tracking sets and reps
 - tracking notes per exercise
 - tracking rest time


This app is made to be used on the gym floor, so the ease-of-use is a key tenant. This means
large/easy-to-tap elements, clean text, and simple flows.

Rather than being a huge, multi-faceted app, we'll focus on doing a couple things well with
reasonably tight flows.

# Log View

The home/main view of the app will show you a list of your the previous workouts
chronologically.

At the top of the list there will be a button to start a new workout. Starting a workout
takes you to the Workout View.

# Workout View
This is the main view where users will work and be guided through their workout. 

After starting a workout, the flow essentially works like this:
	0. Block list view
	   Lists all blocks (i.e. 'phases' of exercise). by default it will be an empty list, with a button
	   at the top for 'Add block' and a button at the bottom for 'finish workout'. 'Add block' goes to the
	   "show 'new block view'" section.
 	1. Show 'new block view'
	   New Block view is essentially a list of exercises, displayed as cards/'blocks' that will be done
	   together. It may be one or many exercises. At the top of the list there is a button to add an 
	   exercise. At the bottom of the list, there are two elements: an option to change the rest timer 
	   (default off), and another option to start the block. Clicking 'add an exercise' will pop a new
	   flow/modal which behaves like the following:
	 	a. you are prompted to select an exercise
		b. you are prompted to set your goals. goals (for now) have two fields: sets, reps and weight.
		   Entering goals will look like this:
			Reps: [   ]   Weight: [     ]    Sets: [  1   ]
 		   There should be a button to add a new set.
		   If the user has previously set their 'next session' values, then we should prepopulate those
		   along with a visual indicator that it was 'proposed'
		c. a button 'Lock In'
		d. This then renders into a card/block that can be tapped to edit in the list. The "add an exercise"
		   button becomes 'Create Superset' (which returns you to a). The timer and start block button still
		   are present.
	2. Block In Progress Set
	   This screen will be divided into two sections: 
		a. the top of the screen: a full-width timer It will display the timer value picked on the last 
		   screen. Over top of the timer, it will say "tap to start". When it expires, it simply refreshes
		b. middle of the screen: displays the active movement along with the goals.
		   The top of this is divided into a few section itself:
			a. the top shows the exercise name. If there are multiple exercises (due to superset), 
			   they also visible, but this is a tab-based view, and the exercises are the tab labels
			b. below shows the sets/rep ranges for the particular exercise. Similar to the goals view,
			   it should have a rows, one per set, for reps and weight. The existing rows (sets) can be
			   deleted, or more can be added. It should show the goal reps/weight beside the boxes.
		c. bottom of the screen: 'finish block' button
	3. Block Finished: goes back to the block view screen
	4. repeat adding blocks and exercises until done
	5. click Finish block
	6. the workout moves into the log view.
			    

