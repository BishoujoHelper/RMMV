//=============================================================================
// MrTS_PartyManager.js
//=============================================================================

/*:
* @plugindesc Change the party and available characters, can specify limits.
* @author Mr. Trivel  (edits by BishoujoHelper & BenMakesGames)
*
* @param In Menu
* @desc Is Party Manager command shown in Menu?
* @type boolean
* @default true
* @on YES
* @off NO
*
* @param Command Name
* @desc Text for Party Manager's command in Menu.
* Default: Party
* @default Party
*
* @param Party Text
* @desc Text for the party.
* Default: Party
* @default Party
*
* @param Reserve Text
* @desc Text for available characters not in party.
* Default: Reserve
* @default Reserve
*
* @param Must Use Text
* @desc Text for Must Use characters.
* Default: Must Use:
* @default Must Use:
*
* @param Use <= instead
* @desc Use "<=" if "≤" isn't supported by game's font.
* @type boolean
* @default false
* @on YES
* @off NO
*
* @param Auto-bump
* @desc Bump excess from party automatically?
* @type boolean
* @default false
* @on YES
* @off NO
*
* @param Show MP
* @desc Show MP in Party Manager?
* @type boolean
* @default true
* @on YES
* @off NO
*
* @param Show TP
* @desc Show TP in Party Manager?
* @type boolean
* @default false
* @on YES
* @off NO
*
* @help
* -----------------------------------------------------------------------------
* Terms of Use
* -----------------------------------------------------------------------------
* Don't remove the header or claim that you wrote this plugin.
* Credit Mr. Trivel if using this plugin in your project.
* Free for commercial and non-commercial projects.
* -----------------------------------------------------------------------------
* Version 1.305
* -----------------------------------------------------------------------------
*
* -----------------------------------------------------------------------------
* Plugin Commands
* -----------------------------------------------------------------------------
* PartyManager Open - Opens Party Manager (PM) Scene immediately
*
* PartyManager Require [AMOUNT] - Require specific amount of members in party
*                               - 0 for any amount
* PartyManager AtLeast [AMOUNT] - Minimum members in party (>= 1)
* PartyManager AtMost [AMOUNT]  - Maximum members in party (default 4)
*                               - where 1 <= AtLeast <= AtMost
* ** Each valid use of Require or AtLeast/AtMost sets which of the two kinds
*    (Require to start, AtLeast/AtMost if used) of party size limit is
*    currently in effect. The visible party size limits change to show it.
* ** Excess party members can be bumped to reserve when amounts are lowered.
*
* PartyManager MustUse [ID]       - Must use the actor with ID in party
* PartyManager MustUseRemove [ID] - Cancel needing the actor with ID
* PartyManager MustUseClear       - Cancels need for any "must use" actors
*
* PartyManager Add [ID]    - Add an actor to reserve area
* PartyManager Remove [ID] - Remove an actor from reserve to "outside"
* PartyManager AddsClear   - Removes all actors from reserve to "outside"
*
* PartyManager Lock [ID]   - Lock (make unselectable) an actor
* PartyManager Unlock [ID] - Unlock (make selectable) an actor
* PartyManager LocksClear  - Unlock all actors known to plugin
*
* PartyManager MenuLock   - Disable command in Menu (grey out)
* PartyManager MenuUnlock - Enable command in Menu
*
* PartyManager FirstMessage [text] - Text that first appears in Help window
* default (without quotes) "Help messages for the Party Manager appear here."
*
* Examples:
* PartyManager Require 0     > Party can have any amount of characters
* PartyManager Require 3     > Party must have exactly 3 characters
*
* PartyManager AtLeast 2     > Party must have at least 2 characters
* PartyManager AtMost 3      > Party must have 3 or less characters
*
* PartyManager MustUse 2           > Party must use Actor with ID #2
* PartyManager MustUseRemove 5     > Remove "must use" for Actor #5
* PartyManager MustUseClear        > Clears all "must use" entries
*
* PartyManager Add 7         > Adds Actor with ID #7 to the reserve area
* PartyManager Remove 8      > Removes Actor #8 from the reserve
* PartyManager AddsClear     > Clears the reserve
*
* PartyManager Lock 2         > Locks Actor with ID #2 in party or reserve
* PartyManager Unlock 5       > Removes any lock on Actor #5
* PartyManager LocksClear     > Clears all Locks on all Actors ever seen
*
* PartyManager MenuLock       > Disables Party Manager's command on Menu
* PartyManager MenuUnlock     > Enables Party Manager's command on Menu
* PartyManager FirstMessage Arrange party by selecting characters to move
*                             > Specify starting help message (spaces are OK)
* PartyManager Open           > Opens the Party Manager screen directly
* -----------------------------------------------------------------------------
*
* -----------------------------------------------------------------------------
* Version History
* -----------------------------------------------------------------------------
* 1.305 - Template literals. Use PmRequireMode internally for uniqueness.
* 1.3 - Add context-sensitive help window to bottom of PM screen, with plugin
*       command FirstMessage for initial Help text.
*     - Add "Auto-bump" parameter.
*     - Hold Shift key when selecting two characters in Party to swap them,
*       like menu Formation command does. Based on code pulled from the RMMV 
*       Formation command by forum user tennoukishi, and "ClassChangeScene.js" 
*       by xabileug.
*     *Possible issue:
*     - Can set more MustUse characters than fit in the party, causing a 
*       hardlock on PM screen. Detected as error but not resolved.
* 1.2 - Add plugin commands AddsClear, LocksClear, AtLeast and AtMost.
*     - Add plugin parameters "Show MP", "Use <= instead".
*     - Party member numbers display text has color to show validity.
*     - New Script functions for actor status:
*       $gameParty.hasRecruited(actorId)   (from BenMakesGames) and
*       $gameParty.inReserve(actorId)
*       to use in a Conditional Branch event command.
*       "hasRecruited" checks if actor is in Party or Reserve.
*       "inReserve" just checks the Reserve. Both return true/false.
*     *Fixed issues:
*     - Incorrect number of excess members removed when Require decreased.
*     - Duplicate MustUse entries stored.
*     - "invisible characters in reserve area" fix by BenMakesGames.
*     - Lock wasn't effective or visible on party characters.
*     - Hardlock on PM screen if Lock and MustUse were both set on a 
*       reserve character, now the Lock is cleared so it can move.
*     - Hardlock on PM screen if Lock and MustUse were both set on an
*       "invisible" (not in party or reserve) character, now it's put in
*       reserve and Unlocked.
*     - Add of a character in the party caused a duplicate to appear in
*       the reserve.
* 1.1a- Fixed Lv being out of window in default resolution.
* 1.1 - Fixed disappearing members.
*     - Fixed removing members from party.
* 1.0 - Release
*/

/*jshint esversion: 6 */
var Imported = Imported || {};
var MRTS = MRTS || {};
Imported.PartyManager = 1.305;
MRTS.PartyManager = MRTS.PartyManager || {};

(function() {
	"use strict";

	const params = PluginManager.parameters('MrTS_PartyManager');
	const paramInMenu = (params['In Menu'] == "true");
	const paramCommandName = String(params['Command Name']);
	const paramPartyText = String(params['Party Text']);
	const paramReserveText = String(params['Reserve Text']);
	const paramRequiredText = String(params['Must Use Text']);
	const paramUseGrEqInstead = (params['Use <= instead'] == "true");
	const paramAutoBump = (params['Auto-bump'] == "true");
	const paramDrawMp = (params['Show MP'] == "true");
	const paramDrawTp = (params['Show TP'] == "true");
	var pmFirstHelpText = "Help messages for the Party Manager appear here.";

	//--------------------------------------------------------------------------
	// Game_Interpreter
	//
	// Get plugin commands and arguments.

	var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
	Game_Interpreter.prototype.pluginCommand = function(command, args) {
		_Game_Interpreter_pluginCommand.call(this, command, args);
		if ( command.toLowerCase() === "partymanager" ) {
			switch ( args[0].toUpperCase() ) {
				case 'OPEN': {
					SceneManager.push(Scene_PartyManager);
				} break;
				case 'REQUIRE': {
					$gameParty.setRequiredPartyMembersAmount(Number(args[1]));
				} break;
				// New plugin command in v1.2
				case 'ATLEAST': {
					$gameParty.setMinimumPartyMembersAmount(Number(args[1]));
				} break;
				// New plugin command in v1.2
				case 'ATMOST': {
					$gameParty.setMaximumPartyMembersAmount(Number(args[1]));
				} break;
				case 'MUSTUSE': {
					// v1.2 Ignore invalid input ID.
					if ( $gameActors.actor(Number(args[1])) ) {
						$gameParty.mustUseThisMember(Number(args[1]));
					}
				} break;
				case 'MUSTUSEREMOVE': {
					// v1.2 Ignore invalid input ID.
					if ( $gameActors.actor(Number(args[1])) ) {
						$gameParty.mustUseCancelThisMember(Number(args[1]));
					}
				} break;
				case 'MUSTUSECLEAR': {
					$gameParty.mustClearPartyMembers();
				} break;				
				case 'ADD': {
					// v1.2 Ignore invalid input ID.
					if ( $gameActors.actor(Number(args[1])) ) {
						$gameParty.addMemberToPartyManager(Number(args[1]));
					}
				} break;
				case 'REMOVE': {
					// v1.2 Ignore invalid input ID.
					if ( $gameActors.actor(Number(args[1])) ) {
						$gameParty.removeMemberFromPartyManager(Number(args[1]));
					}
				} break;
				// New plugin command in v1.2
				case 'ADDSCLEAR': {
					$gameParty.removeAllReserveFromPartyManager();
				} break;
				case 'LOCK': {
					// v1.2 Ignore invalid input ID.
					if ( $gameActors.actor(Number(args[1])) ) {
						$gameParty.lockPartyMember(Number(args[1]));
					}
				} break;
				case 'UNLOCK': {
					// v1.2 Ignore invalid input ID.
					if ( $gameActors.actor(Number(args[1])) ) {
						$gameParty.unlockPartyMember(Number(args[1]));
					}
				} break;
				// New plugin command in v1.2
				case 'LOCKSCLEAR': {
					$gameParty.unlockAllPartyMembers();
				} break;
				case 'MENULOCK': {
					$gameSystem.partyManagerMenuDisabled(true);
				} break;
				case 'MENUUNLOCK': {
					$gameSystem.partyManagerMenuDisabled(false);
				} break;
				// New plugin command in v1.3
				case 'FIRSTMESSAGE': {
					args.splice(0,1);
					pmFirstHelpText = String(args.join(" "));
				} break;
			}
		}
	};

	//--------------------------------------------------------------------------
	// Game_System
	//
	// Control access to Party Manager's menu command.

	Game_System.prototype.partyManagerMenuDisabled = function(t) {
		this._partyManagerMenuDisabled = t;
	};

	Game_System.prototype.isPartyManagerInMenuDisabled = function() {
		return !!this._partyManagerMenuDisabled;
	};

	//--------------------------------------------------------------------------
	// Window_MenuCommand
	//
	// Reveal or conceal Party Manager's menu command.

	var _Window_MenuCommand_addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
	Window_MenuCommand.prototype.addOriginalCommands = function() {
		_Window_MenuCommand_addOriginalCommands.call(this);
		if ( paramInMenu )
			this.addCommand(paramCommandName, 'partyManager', !$gameSystem.isPartyManagerInMenuDisabled());
	};

	//--------------------------------------------------------------------------
	// Scene_Menu
	//
	// Connect plugin's menu command to scene/GUI.

	var _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
	Scene_Menu.prototype.createCommandWindow = function() {
		_Scene_Menu_createCommandWindow.call(this);
		this._commandWindow.setHandler('partyManager', this.commandPartyManager.bind(this));
	};

	Scene_Menu.prototype.commandPartyManager = function() {
		SceneManager.push(Scene_PartyManager);
	};

	//--------------------------------------------------------------------------
	// Game_Actor
	//
	// Initialize an actor in party as known Party Manager member.

	var _Game_Actor_initialize = Game_Actor.prototype.initialize;
	Game_Actor.prototype.initialize = function(actorId) {
		// If the Actor being initialized isn't known to the Party Manager, the "removeMember" puts it in the Outsiders list.
		// Which is OK when the initializing is for a Party actor, because Outsiders includes Party.
		if ( !$gameParty.partyManagerMemberExists(actorId) ) {
			$gameParty.removeMemberFromPartyManager(actorId);
		}
		_Game_Actor_initialize.call(this, actorId);
	};

	//--------------------------------------------------------------------------
	// Game_Party
	//
	// Party and Reserve record-keeping, plugin commands and status functions.

	var _Game_Party_initialize = Game_Party.prototype.initialize;
	Game_Party.prototype.initialize = function() {
		_Game_Party_initialize.call(this);      // append plugin's stuff to existing party data
		this._partyManagerReserve = [];		// records for the actors the PM is really managing.
		this._partyManagerOutsiders = [];	// records for actors known but not in Reserve - could be in Party, could be outside Reserve.
		this._requiredPartyManagerAmount = 0;	// party size initially not limited
		// v1.2 ._PmRequireMode=true means Require value has priority, so plugin initially acts like earlier versions.
		this._PmRequireMode = true;
		this._atLeastPartyManagerAmount = 1;
		this._atMostPartyManagerAmount = 4;	// v1.2 Use 4 because $gameParty.maxBattleMembers() isn't valid yet!
		this._mustUsePartyManagerMembers = [];	// just actor #s
	};

	Game_Party.prototype.CreatePartyManagerMember = function() {
		return {ID: 0, Locked: false};   // an actor's PM record is just their ID & Locked status
	};

	Game_Party.prototype.getRequiredPartyMembersAmount = function() {
		return this._requiredPartyManagerAmount;
	};

	// v1.2 Based on orphaned "requirePartyMemberAmount" function in v1.1a, with bug fix. Ignores <0.
	// If Require >0 and lowered below current party size, then characters can be removed from old Party end to Reserve.
	Game_Party.prototype.setRequiredPartyMembersAmount = function(amount) {
		if ( amount >= 0 ) {
			this._requiredPartyManagerAmount = amount;
			this._PmRequireMode = true;
			if ( amount > 0 && paramAutoBump ) {
				const partySize = this.members().length;
				if ( partySize > amount ) {
					for (let i = partySize - 1; i >= amount; i--) {
						this.removeActor(this.members()[i].actorId());
					}
				}
			}
		}
	};

	// New in v1.2 to support AtLeast and AtMost.
	Game_Party.prototype.PMRequireMode = function() {
		return !!this._PmRequireMode;
	};

	// New in v1.2 for AtLeast.
	Game_Party.prototype.getMinimumPartyMembersAmount = function() {
		return this._atLeastPartyManagerAmount;
	};

	// New in v1.2 for AtLeast. Ignores <=0. Maximum value is total of Party and Reserve actors to avoid hardlock.
	// When raised above current AtMost, that's raised too for safety.
	Game_Party.prototype.setMinimumPartyMembersAmount = function(amount) {
		if ( amount > 0 ) {
			this._PmRequireMode = false;
			amount = Math.min(this.members().length + this._partyManagerReserve.length, amount);
			this._atLeastPartyManagerAmount = amount;
			if ( amount > this._atMostPartyManagerAmount ) {
				$gameParty.setMaximumPartyMembersAmount(amount);
			} else {
				// Just in case AtLeast change turned off RequireMode and revealed AtMost is too low for current party.
				$gameParty.setMaximumPartyMembersAmount($gameParty.getMaximumPartyMembersAmount);
			}
		}
	};

	// New in v1.2 for AtMost.
	Game_Party.prototype.getMaximumPartyMembersAmount = function() {
		return this._atMostPartyManagerAmount;
	};

	// New in v1.2 for AtMost. Ignores <=0. When lowered below current AtLeast, that's lowered too for safety.
	// When lowered below current Party size, characters can be removed from old Party end to Reserve.
	Game_Party.prototype.setMaximumPartyMembersAmount = function(amount) {
		if ( amount > 0 ) {
			this._PmRequireMode = false;
			this._atMostPartyManagerAmount = amount;
			if ( amount < this._atLeastPartyManagerAmount ) {
				$gameParty.setMinimumPartyMembersAmount(amount);
			}
			const partySize = this.members().length;
			if ( partySize > amount && paramAutoBump) {
				for (let i = partySize - 1; i >= amount; i--) {
					this.removeActor(this.members()[i].actorId());
				}
			}
		}
	};

	Game_Party.prototype.getRequiredPartyMembers = function() {
		return this._mustUsePartyManagerMembers;
	};

	Game_Party.prototype.getPartyManagerReserve = function() {
		return this._partyManagerReserve;
	};

	// v1.2 Added.
	Game_Party.prototype.getPartyManagerOutsiders = function() {
		return this._partyManagerOutsiders;
	};

	Game_Party.prototype.partyManagerMemberExists = function(id) {
/* v1.2 try replacing original with code mostly by BenMakesGames
*		for (let i = 0; i < this._partyManagerReserve.length; i++) {
*			if ( this._partyManagerReserve[i].ID === id ) return true;
*		}
*		for (let i = 0; i < this._partyManagerOutsiders.length; i++) {
*			if ( this._partyManagerOutsiders[i].ID === id ) return true;
*		}
*		return false;
*	};
*/
		// v1.2 Outsiders includes Party characters if things work properly. Code mostly by BenMakesGames.
		// check PM Reserve list:
		if ( this._partyManagerReserve.findIndex(m => m.ID === id) >= 0 ) return true;
		// check PM Outsiders list:
		if ( this._partyManagerOutsiders.findIndex(m => m.ID === id) >= 0 ) return true;
		// not in any? alright, then:
		return false;
	};

// v1.2 Status function intended for use in Conditional Branch event commands as:
//    $gameParty.hasRecruited(actorId)
// Returns true if actor with that Id is currently in Party or Reserve, false if not.
// Based on code by BenMakesGames.
	Game_Party.prototype.hasRecruited = function(actorId) {
		// check current party members:   ?BH asks if this is correct array?
		if ( this._actors.indexOf(actorId) >= 0 ) return true;
		// Lastly check reserve and done.
		return (this._partyManagerReserve.findIndex(m => m.ID === actorId) >= 0) ? true : false;
	};

// v1.2 Status function intended for use in Conditional Branch event commands as:
//    $gameParty.inReserve(actorId)
// returns true if actor with that Id is currently in Reserve, false if not.
// Based on code by BenMakesGames.
	Game_Party.prototype.inReserve = function(actorId) {
		return (this._partyManagerReserve.findIndex(m => m.ID === actorId) >= 0) ? true : false;
	};

	Game_Party.prototype.partyMemberInParty = function(id) {
		for (let i = 0; i < this.members().length; i++) {
			if ( this.members()[i].actorId() === id ) return true;
		}
		return false;
/* Script Calls google sheet is confusing, but maybe instead:
*		if ( this.actor(id).index() >= 0 ) return true;
*		return false;
*/
// or even shorter with:?
//		return (this.actor(id).index() >= 0) ? true : false;
/* v1.2 proposed replacement code by BenMakesGames, but is that the same data?
*		// check current party:
*		if ( this._actors.indexOf(id) >= 0 ) return true;
*		return false;
*/
// BH: can even that be reduced to?
//		return (this._actors.indexOf(id) >= 0) ? true : false;
	};

	Game_Party.prototype.addMemberToPartyManager = function(id) {
		if ( !this.partyManagerMemberExists(id) ) {	// Was previously unknown.
			let tmpMember = this.CreatePartyManagerMember();
			tmpMember.ID = id;
			if ( this.partyMemberInParty(id) ) {
				// If it's not in the PM and in the Party, it's an Outsider (not Reserve).
				this._partyManagerOutsiders.push(tmpMember);
			} else {
				// If it's not in the PM and not in the Party, goes to Reserve.
				this._partyManagerReserve.push(tmpMember);
			}
			ImageManager.loadCharacter($gameActors.actor(id).characterName());
		// v1.2 Prevent Add of a current Party member causing it to appear in Reserve too.
		} else if ( !this.inReserve(id) && !this.partyMemberInParty(id) ) {
			// An Add on an Outsider makes it a Reserve, but on a Reserve it has no effect.
			for (let i = 0; i < this._partyManagerOutsiders.length; i++) {
				let member = this._partyManagerOutsiders[i];
				if ( member.ID === id ) {
					this._partyManagerReserve.push(member);
					this._partyManagerOutsiders.splice(i, 1);
					break;
				}
			}
		}
	};

	Game_Party.prototype.removeMemberFromPartyManager = function(id) {
		if ( !this.partyManagerMemberExists(id) ) {	// Was previously unknown.
			let tmpMember = this.CreatePartyManagerMember();
			tmpMember.ID = id;
			this._partyManagerOutsiders.push(tmpMember);
		} else if ( this.inReserve(id) ) {
			// A Remove on a Reserve makes it an Outsider, but on an Outsider it has no effect.
			for (let i = 0; i < this._partyManagerReserve.length; i++) {
				let member = this._partyManagerReserve[i];
				if ( member.ID === id ) {
					this._partyManagerOutsiders.push(member);
					this._partyManagerReserve.splice(i, 1);
					break;
				}
			}
		}
	};

	// New in v1.2 for AddsClear. Move all Reserve to Outsiders, without duplicates.
	Game_Party.prototype.removeAllReserveFromPartyManager = function() {
		for (let i = 0; i < this._partyManagerReserve.length; i++) {
			let member = this._partyManagerReserve[i];
			let id = member.ID;
			if ( this._partyManagerOutsiders.findIndex(m => m.ID === id) < 0 ) {
				this._partyManagerOutsiders.push(member);
			}
		}
		this._partyManagerReserve = [];
	};

	Game_Party.prototype.lockPartyMember = function(id) {
		if ( !this.partyManagerMemberExists(id) ) {	// Was previously unknown.
			let tmpMember = this.CreatePartyManagerMember();
			tmpMember.ID = id;
			tmpMember.Locked = true;
			this._partyManagerOutsiders.push(tmpMember);
		} else if ( this.inReserve(id) ) {
			for (let i = 0; i < this._partyManagerReserve.length; i++) {
				if ( this._partyManagerReserve[i].ID === id ) {
					// v1.2 Prevent hardlock from Lock and MustUse on a Reserve character: Unlock.
					if ( this._mustUsePartyManagerMembers.includes(id) ) {
						this._partyManagerReserve[i].Locked = false;
					} else {
						this._partyManagerReserve[i].Locked = true;
					}
					break;
				}
			}
		} else {	// in Party or invisible Outsiders
			for (let i = 0; i < this._partyManagerOutsiders.length; i++) {
				let member = this._partyManagerOutsiders[i];
				if ( member.ID === id ) {
					// v1.2 Prevent hardlock from Lock and MustUse on a non-Party Outsiders character: Unlock and move to Reserve.
					if ( !this.partyMemberInParty(id) && this._mustUsePartyManagerMembers.includes(id) ) {
						member.Locked = false;
						this._partyManagerReserve.push(member);
						this._partyManagerOutsiders.splice(i, 1);
					} else {
						member.Locked = true;
					}
					break;
				}
			}
		}
	};

	Game_Party.prototype.unlockPartyMember = function(id) {
		if ( !this.partyManagerMemberExists(id) ) {	// Was previously unknown.
			let tmpMember = this.CreatePartyManagerMember();
			tmpMember.ID = id;
			tmpMember.Locked = false;
			this._partyManagerOutsiders.push(tmpMember);
		} else if ( this.inReserve(id) ) {
			for (let i = 0; i < this._partyManagerReserve.length; i++) {
				if ( this._partyManagerReserve[i].ID === id ) {
					this._partyManagerReserve[i].Locked = false;
					break;
				}
			}
		} else {
			for (let i = 0; i < this._partyManagerOutsiders.length; i++) {
				if ( this._partyManagerOutsiders[i].ID === id ) {
					this._partyManagerOutsiders[i].Locked = false;
					break;
				}
			}
		}
	};

	// New in v1.2 for LocksClear.
	Game_Party.prototype.unlockAllPartyMembers = function() {
		for (let i = 0; i < this._partyManagerOutsiders.length; i++) {
			this._partyManagerOutsiders[i].Locked = false;
		}
		for (let i = 0; i < this._partyManagerReserve.length; i++) {
			this._partyManagerReserve[i].Locked = false;
		}
	};

	Game_Party.prototype.mustUseThisMember = function(id) {
		if ( !this.partyManagerMemberExists(id) ) {	// Was previously unknown.
			let tmpMember = this.CreatePartyManagerMember();
			tmpMember.ID = id;
			if ( this.partyMemberInParty(id) ) {
				// If it's not in the PM but in the Party, it's Outside (not a Reserve).
				this._partyManagerOutsiders.push(tmpMember);
			} else {
				// If it's not in the PM and not in the Party, it's Reserve.
				// v1.2 Would set it Unlocked now to avoid hardlock, but they are when created.
				this._partyManagerReserve.push(tmpMember);
			}
		} else if ( this.inReserve(id) ) {
			// v1.2 Prevent hardlock from Lock and MustUse on a Reserve character: Unlock.
			for (let i = 0; i < this._partyManagerReserve.length; i++) {
				if ( this._partyManagerReserve[i].ID === id ) {
					this._partyManagerReserve[i].Locked = false;
					break;
				}
			}
		} else if ( !this.partyMemberInParty(id) ) {
			// v1.2 Prevent hardlock from Lock and MustUse on a non-Party Outsiders character: Unlock and move to Reserve.
			for (let i = 0; i < this._partyManagerOutsiders.length; i++) {
				if ( this._partyManagerOutsiders[i].ID === id ) {
					let member = this._partyManagerOutsiders[i];
					if ( member.Locked ) {
						member.Locked = false;
						this._partyManagerReserve.push(member);
						this._partyManagerOutsiders.splice(i, 1);
					}
					break;
				}
			}
		}
		// v1.2 Bugfix: No duplicate entries.
		if ( !this._mustUsePartyManagerMembers.includes(id) ) {
			this._mustUsePartyManagerMembers.push(id);
		}
	};

	Game_Party.prototype.mustUseCancelThisMember = function(id) {
// v1.1a used:	if ( this._mustUsePartyManagerMembers.contains(id) ) {
		if ( this._mustUsePartyManagerMembers.includes(id) ) {
			this._mustUsePartyManagerMembers.splice( this._mustUsePartyManagerMembers.indexOf(id), 1);
		}
	};

	Game_Party.prototype.mustClearPartyMembers = function() {
		this._mustUsePartyManagerMembers = [];
	};

	// Hook into RMMV Change Party Member / Add event command.
	var _Game_Party_addActor = Game_Party.prototype.addActor;
	Game_Party.prototype.addActor = function(actorId) {
		// If the Actor about to be added isn't in the Party already, the "Remove" will put it in the Outsiders list.
		if ( !this._actors.contains(actorId) ) {
			this.removeMemberFromPartyManager(actorId);
		}
		_Game_Party_addActor.call(this, actorId);
	};

	// Hook into RMMV Change Party Member / Remove event command.
	var _Game_Party_removeActor = Game_Party.prototype.removeActor;
	Game_Party.prototype.removeActor = function(actorId) {
		// v1.2 If the Actor being removed was in the Party, the "Add" will put it in the Reserve afterward.
		if ( this._actors.contains(actorId) ) {
			_Game_Party_removeActor.call(this, actorId);
			this.addMemberToPartyManager(actorId);
		} else {
			_Game_Party_removeActor.call(this, actorId);
		}
	};

	//--------------------------------------------------------------------------
	// Scene_PartyManager
	//
	// Manages party and reserve in GUI.

	function Scene_PartyManager() {
		this.initialize.apply(this, arguments);
	}

	Scene_PartyManager.prototype = Object.create(Scene_MenuBase.prototype);
	Scene_PartyManager.prototype.constructor = Scene_PartyManager;

	Scene_PartyManager.prototype.initialize = function() {
		Scene_MenuBase.prototype.initialize.call(this);
	};

	Scene_PartyManager.prototype.create = function() {
		Scene_MenuBase.prototype.create.call(this);
		this.createWindowPartyName();
		this.createWindowPartyList();
		this.createWindowReserveName();
		this.createWindowHelpText();   //v1.3 HelpText appears below ReserveList and ActorInfo, but must be created before them.
		this.createWindowReserveList();
		this.createWindowActorInfo();
	};

	Scene_PartyManager.prototype.createWindowPartyName = function() {
		const ww = 816 / 3;
		const wx = Graphics.boxWidth / 2 - 816 / 2;
		const wy = Graphics.boxHeight / 2 - 624 / 2;
		this._windowPartyName = new Window_PartyManager_PartyName(wx, wy, ww);
		this.addWindow(this._windowPartyName);
	};

	Scene_PartyManager.prototype.createWindowPartyList = function() {
		const ww = this._windowPartyName.width;
		const wx = this._windowPartyName.x;
		const wy = this._windowPartyName.y + this._windowPartyName.height;
		this._windowPartyList = new Window_PartyManager_PartyList(wx, wy, ww);
		this._windowPartyList.setHandler('ok',     this.partyOk.bind(this));
		this._windowPartyList.setHandler('cancel', this.partyCancel.bind(this));
		this.addWindow(this._windowPartyList);
		this.setPendingIndex(-1);	// v1.3 Start with index -1 (invalid) as previous one for Formation-style swap.
		this._windowPartyList.select(0);
		this._windowPartyList.activate();
	};

	Scene_PartyManager.prototype.createWindowReserveName = function() {
		const ww = this._windowPartyList.width;
		const wx = this._windowPartyList.x;
		const wy = this._windowPartyList.y + this._windowPartyList.height;
		this._windowReserveName = new Window_PartyManager_ReserveName(wx, wy, ww);
		this.addWindow(this._windowReserveName);
	};

	// v1.3 Help text is one line high at the bottom of the screen, taken from Reserve List and Actor Info area.
	Scene_PartyManager.prototype.createWindowHelpText = function() {
		const ww = 816;
		const wx = this._windowReserveName.x;
		// For height of the window have to cheat by copying PartyName, also one line of text.
		const wh = this._windowPartyName.height;
		const wy = this._windowPartyName.y + 624 - wh;
		this._windowHelpText = new Window_PartyManager_HelpText(wx, wy, ww);
		this._windowHelpText.setText(pmFirstHelpText);
		this.addWindow(this._windowHelpText);
	};

	Scene_PartyManager.prototype.createWindowReserveList = function() {
		const ww = this._windowReserveName.width;
		const wx = this._windowReserveName.x;
		const wy = this._windowReserveName.y + this._windowReserveName.height;
		const wh = 624 - this._windowPartyName.height - this._windowPartyList.height - this._windowReserveName.height - this._windowHelpText.height;
		this._windowReserveList = new Window_PartyManager_ReserveList(wx, wy, ww, wh);
		this._windowReserveList.setHandler('ok',     this.reserveOk.bind(this));
		this._windowReserveList.setHandler('cancel', this.reserveCancel.bind(this));
		this.addWindow(this._windowReserveList);
	};

	Scene_PartyManager.prototype.createWindowActorInfo = function() {
		const ww = 816 - this._windowReserveName.width;
		const wx = this._windowReserveName.x + this._windowReserveName.width;
		const wy = this._windowPartyName.y;
		const wh = 624 - this._windowHelpText.height;
		this._windowActorInfo = new Window_PartyManager_ActorInfo(wx, wy, ww, wh);
		this._windowActorInfo.setActor($gameParty.members()[0]);
		this.addWindow(this._windowActorInfo);
		this._windowReserveList.setInfoWindow(this._windowActorInfo);
		this._windowPartyList.setInfoWindow(this._windowActorInfo);
	};

	Scene_PartyManager.prototype.partyOk = function() {
		// v1.3 Check for Shift key held down when OK triggered as select in Party list, to indicate trying to swap Formation-style.
		if ( Input.isPressed('shift') ) {
			if ( $gameParty.members().length <= 1 ) {
				this._windowHelpText.setText(`Too few characters in ${paramPartyText} to swap.`);
				this._windowPartyList.playBuzzerSound();
				this._windowPartyList.activate();
			} else {
				this.partyShift();
			}
		} else {
			this._windowPartyList.deactivate();
			this.setPendingIndex(-1);
			this._windowReserveList.select(0);
			this._windowReserveList.activate();
			this._windowHelpText.setText(`Select ${paramReserveText} character to swap with selected in ${paramPartyText}.`);
		}
	};

	// v1.3 When "Shift" held down can do a second select in the PartyList to swap two Party members, to replace Formation menu command.
	Scene_PartyManager.prototype.partyShift = function() {
		let selectedIndex = this._windowPartyList.index();
		let selectedActor = this._windowPartyList.item(selectedIndex);
		let savedIndex = this.pendingIndex();
		let savedActor = this._windowPartyList.item(savedIndex);
		if ( savedActor && selectedActor ) {
			$gameParty.swapOrder(selectedIndex, savedIndex);
			SoundManager.playOk();
			this.setPendingIndex(-1);
			this._windowPartyList.refresh();
			this._windowHelpText.setText(`Select character, holding Shift to swap within ${paramPartyText}.`);
		} else if ( selectedActor ) {
			this._windowHelpText.setText("While holding Shift, select another character to swap them.");
			this.setPendingIndex(selectedIndex);
		}
		this._windowPartyList.activate();
	};

	Scene_PartyManager.prototype.partyCancel = function() {
		const reqAmount = $gameParty.getRequiredPartyMembersAmount();
		const minAmount = $gameParty.getMinimumPartyMembersAmount();
		const maxAmount = $gameParty.getMaximumPartyMembersAmount();
		const requireMode = $gameParty.PMRequireMode();
		const mustHaves = $gameParty.getRequiredPartyMembers();
		const partySize = $gameParty.members().length;
		// v1.3 Clear any saved previously selected Party member when doing a Cancel.
		if ( this.pendingIndex() >= 0 ) {
			this.setPendingIndex(-1);
		}
		if ( partySize === 0 ) {
			this._windowHelpText.setText(`${paramPartyText} has nobody in it!`);
			this._windowPartyList.playBuzzerSound();
			return;
		}
		// v1.2 Account for other amounts than just Require.
		if ( requireMode ) {
			if ( reqAmount > 0 && partySize !== reqAmount ) {
				this._windowHelpText.setText(`Not the required number in ${paramPartyText}!`);
				this._windowPartyList.playBuzzerSound();
				return;
			}
		} else {
			if ( partySize < minAmount ) {
				this._windowHelpText.setText(`Too few in ${paramPartyText}!`);
				this._windowPartyList.playBuzzerSound();
				return;
			} else if ( partySize > maxAmount ) {
				this._windowHelpText.setText(`Too many in ${paramPartyText}!`);
				this._windowPartyList.playBuzzerSound();
				return;
			}
		}
		// v1.3 Can detect too many MustUse for party size, but what to do about them?
		if ( partySize < mustHaves.length ) {
			this._windowHelpText.setText(`Too many "${paramRequiredText}" set to fit in ${paramPartyText}!`);
			this._windowPartyList.playBuzzerSound();
			return;
		}
		for (let i = 0; i < mustHaves.length; i++) {
			let actor = $gameActors.actor(mustHaves[i]);
			if ( !$gameParty.members().contains(actor) ) {
				this._windowHelpText.setText(`Missing a "${paramRequiredText}"!`);
				this._windowPartyList.playBuzzerSound();
				return;
			}
		}
		SoundManager.playCancel();
		this.popScene();
	};

	Scene_PartyManager.prototype.reserveOk = function() {
		let reserveActor = this._windowReserveList.item(this._windowReserveList.index());
		let partyActor = this._windowPartyList.item(this._windowPartyList.index());
		if ( reserveActor )
			$gameParty.addActor(reserveActor.actorId());
		if ( partyActor ) {
			$gameParty.swapOrder(this._windowPartyList.index(), $gameParty.members().length - 1);
			$gameParty.removeActor(partyActor.actorId());
		}
		this._windowReserveList.refresh();
		this._windowReserveName.refresh();
		this._windowPartyList.refresh();
		this._windowPartyName.refresh();
		this._windowReserveList.deselect();
		this._windowReserveList.deactivate();
		this._windowPartyList.activate();
		this._windowHelpText.setText(`Select character, holding Shift to swap within ${paramPartyText}.`);
	};

	Scene_PartyManager.prototype.reserveCancel = function() {
		this._windowReserveList.deselect();
		this._windowReserveList.deactivate();
		this._windowPartyList.activate();
		this._windowHelpText.setText(`Select character, holding Shift to swap within ${paramPartyText}.`);
	};

	// v1.3 A needed function copied from Formation code in rpg_windows.js then modified.
	Scene_PartyManager.prototype.pendingIndex = function()  {
		return this._pendingIndex;
	};

	// v1.3 Saves an index value for a Formation swap, draws current and saved to show they're selected. Also copied from Formation code and modified.
	Scene_PartyManager.prototype.setPendingIndex = function(index)  {
		const lastPendingIndex = this._pendingIndex;
		this._pendingIndex = index;
		if ( lastPendingIndex >= 0 ) this._windowPartyList.drawItem(lastPendingIndex);
		if ( index >= 0 ) this._windowPartyList.drawItem(index);
	};

	//--------------------------------------------------------------------------
	// Window_PartyManager_PartyName
	//
	// Shows party name, current amounts and validity.

	function Window_PartyManager_PartyName() {
		this.initialize.apply(this, arguments);
	}

	Window_PartyManager_PartyName.prototype = Object.create(Window_Base.prototype);
	Window_PartyManager_PartyName.prototype.constructor = Window_PartyManager_PartyName;

	Window_PartyManager_PartyName.prototype.initialize = function(x, y, w) {
		Window_Base.prototype.initialize.call(this, x, y, w, this.fittingHeight(1));
		this.refresh();
	};

	Window_PartyManager_PartyName.prototype.refresh = function() {
		this.contents.clear();
		let txt = `${paramPartyText} (`;
		// v1.2 Use text color to indicate validity of currentAmount: .systemColor() is blue, .deathColor() is red - from img\system\Window.png file.
		let color = this.systemColor();
		const currentAmount = $gameParty.members().length;
		const reqAmount = $gameParty.getRequiredPartyMembersAmount();
		const minAmount = $gameParty.getMinimumPartyMembersAmount();
		const maxAmount = $gameParty.getMaximumPartyMembersAmount();
		const requireMode = $gameParty.PMRequireMode();
		if ( requireMode ) {
			if ( reqAmount > 0 ) {
				txt += ` ${currentAmount} / ${reqAmount} )`;
				if ( currentAmount !== reqAmount )
					color = this.deathColor();
			} else {
				txt += ` ${currentAmount} / >0 )`;
				if ( currentAmount === 0 )
					color = this.deathColor();
			}
		} else {
			// v1.2 For AtLeast & AtMost, allow choosing <= if game's font doesn't support "≤" or it's just preferred.
			if ( paramUseGrEqInstead ) {
				txt += `${minAmount}<=${currentAmount}<=${maxAmount})`;
			} else {
				txt += `${minAmount}≤ ${currentAmount} ≤${maxAmount})`;
			}
			if ( currentAmount < minAmount || currentAmount > maxAmount )
				color = this.deathColor();
		}
		this.changeTextColor(color);
		this.drawText(txt, 0, 0, this.contentsWidth(), 'center');
		this.resetTextColor();
	};

	//--------------------------------------------------------------------------
	// Window_PartyManager_PartyList
	//
	// Shows a list of current party members.

	function Window_PartyManager_PartyList() {
		this.initialize.apply(this, arguments);
	}

	Window_PartyManager_PartyList.prototype = Object.create(Window_Selectable.prototype);
	Window_PartyManager_PartyList.prototype.constructor = Window_PartyManager_PartyList;

	Window_PartyManager_PartyList.prototype.initialize = function(x, y, w) {
		// v1.2 Allocate multiple rows for party, although a single row plus scroll indicator may appear instead?
		const rows = Math.ceil( this.maxItems() / this.maxCols() );
		Window_Selectable.prototype.initialize.call(this, x, y, w, this.fittingHeight() + (rows - 1) * this.itemHeight());
		this.refresh();
	};

	Window_PartyManager_PartyList.prototype.maxItems = function() {
		const requireMode = $gameParty.PMRequireMode();
		const reqAmount = $gameParty.getRequiredPartyMembersAmount();
		const maxAmount = $gameParty.getMaximumPartyMembersAmount();
		const mlen = $gameParty.members().length;
		// v1.2 Account for other amounts.
		if ( requireMode ) {
			if ( reqAmount > 0 )
				return mlen < reqAmount ? mlen + 1 : mlen;
			else
				// v1.2 Can go above $gameParty.maxBattleMembers(), which =4 usually, but a scroll arrow appears rather than box being bigger when Require=0 and mlen=4.
				return mlen +1;
		} else {
			return mlen < maxAmount ? mlen + 1 : mlen;
		}
	};

	Window_PartyManager_PartyList.prototype.maxCols = function() {
		return 4;
	};

	Window_PartyManager_PartyList.prototype.itemWidth = function() {
		return 48;
	};

	Window_PartyManager_PartyList.prototype.itemHeight = function() {
		return 48;
	};

	Window_PartyManager_PartyList.prototype.fittingHeight = function() {
		return this.standardPadding()*2 + this.itemHeight();
	};

	Window_PartyManager_PartyList.prototype.item = function(index) {
		return $gameParty.members()[index];
	};

	Window_PartyManager_PartyList.prototype.drawItem = function(index) {
		let actor = this.item(index);
		if ( actor ) {
			let rect = this.itemRect(index);
			// v1.2 Bugfix: The 2 lines with changePaintOpacity were in the ReserveList part but not here too, so Lock wasn't visible.
			this.changePaintOpacity(this.isItemEnabled(index));
			this.drawActorCharacter(actor, rect.x+24, rect.y+48);
			this.changePaintOpacity(true);
		}
	};

	Window_PartyManager_PartyList.prototype.itemRect = function(index) {
		let rect = new Rectangle();
		const maxCols = this.maxCols();
		rect.width = this.itemWidth();
		rect.height = this.itemHeight();
		rect.x = index % maxCols * (this.contentsWidth() / maxCols);
		rect.y = Math.floor(index / maxCols) * rect.height - this._scrollY;
		return rect;
	};

	Window_PartyManager_PartyList.prototype.setInfoWindow = function(infoWindow) {
		this._infoWindow = infoWindow;
	};

	Window_PartyManager_PartyList.prototype.update = function() {
		Window_Selectable.prototype.update.call(this);
		if ( this._infoWindow && this.item(this.index()) ) {
			this._infoWindow.setActor(this.item(this.index()));
		}
	};

	Window_PartyManager_PartyList.prototype.processCancel = function() {
		this.updateInputData();
		this.callCancelHandler();
	};

	// v1.2 Bugfix: Add function to check .Locked for Party, like for "Reserve".
	Window_PartyManager_PartyList.prototype.isCurrentItemEnabled = function() {
		const actor = this.item(this.index());
		if ( actor ) {
			const id = actor.actorId();
			const outsiders = $gameParty.getPartyManagerOutsiders();
			for (let i = 0; i < outsiders.length; i++) {
				let outmember = outsiders[i];
				if ( outmember.ID === id )
					return !outmember.Locked;
			}
			return true;
		}
		return true;
	};

	// v1.2 Bugfix: Add other function to check .Locked for Party, like for "Reserve".
	Window_PartyManager_PartyList.prototype.isItemEnabled = function(index) {
		const actor = this.item(index);
		if ( actor ) {
			const id = actor.actorId();
			const outsiders = $gameParty.getPartyManagerOutsiders();
			for (let i = 0; i < outsiders.length; i++) {
				let outmember = outsiders[i];
				if ( outmember.ID === id )
					return !outmember.Locked;
			}
			return true;
		}
		return true;
	};

	//--------------------------------------------------------------------------
	// Window_PartyManager_ReserveName
	//
	// Window above reserve list.

	function Window_PartyManager_ReserveName() {
		this.initialize.apply(this, arguments);
	}

	Window_PartyManager_ReserveName.prototype = Object.create(Window_Base.prototype);
	Window_PartyManager_ReserveName.prototype.constructor = Window_PartyManager_ReserveName;

	Window_PartyManager_ReserveName.prototype.initialize = function(x, y, w) {
		Window_Base.prototype.initialize.call(this, x, y, w, this.fittingHeight());
		this.refresh();
	};

	Window_PartyManager_ReserveName.prototype.refresh = function() {
		this.contents.clear();
		const requiredMembers = $gameParty.getRequiredPartyMembers();
		if ( requiredMembers.length > 0 ) {
			const txtWidth = this.textWidth(paramRequiredText);
			this.drawText(paramRequiredText, 0, this.contentsHeight() / 2 - this.lineHeight() / 2);
			let pos = 0;
			for (let i = 0; i < requiredMembers.length; i++) {
				if ( pos === 2 ) {
					break;
				}
				if ( !$gameParty.members().contains($gameActors.actor(requiredMembers[i])) ) {
					this.drawActorCharacter($gameActors.actor(requiredMembers[i]), txtWidth + 24 + 48*pos, 48);
					pos++;
				}			
			}
		} else {
			this.drawText(paramReserveText, 0, this.contentsHeight() / 2 - this.lineHeight() / 2, this.contentsWidth(), 'center');
		}
	};

	Window_PartyManager_ReserveName.prototype.fittingHeight = function() {
		return this.standardPadding()*2 + 48;
	};

	//--------------------------------------------------------------------------
	// Window_PartyManager_ReserveList
	//
	// List of available members not in party.

	function Window_PartyManager_ReserveList() {
		this.initialize.apply(this, arguments);
	}

	Window_PartyManager_ReserveList.prototype = Object.create(Window_Selectable.prototype);
	Window_PartyManager_ReserveList.prototype.constructor = Window_PartyManager_ReserveList;

	Window_PartyManager_ReserveList.prototype.initialize = function(x, y, w, h) {
		Window_Selectable.prototype.initialize.call(this, x, y, w, h);
/* v1.2 Fix for "invisible sprites in Reserve area" by BenMakesGames that was posted at
*  https://github.com/Trivel/RMMV/issues/4
*  in 2020, but apparently not incorporated or noticed by anyone else.
*  Waits for all the PM Reserve members' sprites to be loaded, not trusting the asynchronous process to have finished.
*  (Or could this be done with a Javascript 'promise'?)
*/
		// get a list of Bitmap objects, by asking the ImageManager to load all the characters in Reserve
		var bitmaps = $gameParty.getPartyManagerReserve().map(m => {
			return ImageManager.loadCharacter($gameActors.actor(m.ID).characterName());
		});
		// assume none are loaded yet
		var bitmapsLoaded = 0;
		// method that counts a loaded image, and decides if it's ready to call this.refresh(), or not
		var countLoadedBitmap = () =>
		{
			bitmapsLoaded++;
			if ( bitmapsLoaded === bitmaps.length )
				this.refresh();
		};

		// for each bitmap, either...
		bitmaps.forEach(b => {
			if ( b.isReady() ) {   // it's ready, and we can count it now!
				countLoadedBitmap();
			} else {   // it's not ready, and we must WAIT...
				b.addLoadListener(() => {
					countLoadedBitmap();
				});
			}
		});
		// previously existing this.refresh()... can probably be removed??
		this.refresh();
	};

	Window_PartyManager_ReserveList.prototype.maxItems = function() {
		return $gameParty.getPartyManagerReserve().length + 1;
	};

	Window_PartyManager_ReserveList.prototype.maxCols = function() {
		return 4;
	};

	Window_PartyManager_ReserveList.prototype.itemWidth = function() {
		return 48;
	};

	Window_PartyManager_ReserveList.prototype.itemHeight = function() {
		return 48;
	};

	Window_PartyManager_ReserveList.prototype.fittingHeight = function() {
		return this.standardPadding()*2 + this.itemHeight();
	};

	Window_PartyManager_ReserveList.prototype.item = function(index) {
		if ( $gameParty.getPartyManagerReserve()[index] ) {
			return $gameActors.actor($gameParty.getPartyManagerReserve()[index].ID);
		}
		return null;
	};

	Window_PartyManager_ReserveList.prototype.drawItem = function(index) {
		const actor = this.item(index);
		if ( actor ) {
			let rect = this.itemRect(index);
			this.changePaintOpacity(this.isItemEnabled(index));
			this.drawActorCharacter(actor, rect.x+24, rect.y+48);
			this.changePaintOpacity(true);
		}
	};

	Window_PartyManager_ReserveList.prototype.itemRect = function(index) {
		let rect = new Rectangle();
		const maxCols = this.maxCols();
		rect.width = this.itemWidth();
		rect.height = this.itemHeight();
		rect.x = index % maxCols * (this.contentsWidth() / maxCols);
		rect.y = Math.floor(index / maxCols) * rect.height - this._scrollY;
		return rect;
	};

	Window_PartyManager_ReserveList.prototype.setInfoWindow = function(infoWindow) {
		this._infoWindow = infoWindow;
	};

	Window_PartyManager_ReserveList.prototype.update = function() {
		Window_Selectable.prototype.update.call(this);
		if ( this._infoWindow && this.item(this.index()) ) {
			this._infoWindow.setActor(this.item(this.index()));
		}
	};

	Window_PartyManager_ReserveList.prototype.isCurrentItemEnabled = function() {
		let actor = this.item(this.index());
		if ( actor ) {
			let a = $gameParty.getPartyManagerReserve()[this.index()];
			return !a.Locked;
		}
		return true;
	};

	Window_PartyManager_ReserveList.prototype.isItemEnabled = function(index) {
		let actor = this.item(index);
		if ( actor ) {
			let a = $gameParty.getPartyManagerReserve()[index];
			return !a.Locked;
		}
		return true;
	};

	//--------------------------------------------------------------------------
	// Window_PartyManager_ActorInfo
	//
	// Displays selected actor's info.

	function Window_PartyManager_ActorInfo() {
		this.initialize.apply(this, arguments);
	}

	Window_PartyManager_ActorInfo.prototype = Object.create(Window_Base.prototype);
	Window_PartyManager_ActorInfo.prototype.constructor = Window_PartyManager_ActorInfo;

	Window_PartyManager_ActorInfo.prototype.initialize = function(x, y, w, h) {
		this._actor = null;
		Window_Base.prototype.initialize.call(this, x, y, w, h);
	};

	Window_PartyManager_ActorInfo.prototype.refresh = function() {
		this.contents.clear();
		const actor = this._actor;
		if ( actor ) {
			const x = 0;
			const y = 0;
			const width = this.contentsWidth();
			const lineHeight = this.lineHeight();
			const x2 = x + 180;
			const width2 = Math.min(200, width - 180 - this.textPadding());
			this.drawActorName(actor, x, y);
			this.drawActorClass(actor, x2, y);
			this.drawActorLevel(actor, x2 + width2 + 10, y);
			this.drawHorzLine(y + lineHeight * 1);
			this.drawActorFace(actor, x, y + lineHeight * 2);
			this.drawActorHp(actor, x2, y + lineHeight * 2, width2);
			if ( paramDrawMp )
				this.drawActorMp(actor, x2, y + lineHeight * 3, width2);
			if ( paramDrawTp )
				this.drawActorTp(actor, x2, y + lineHeight * 4, width2);
			this.drawHorzLine(y + lineHeight * 6);
			this.drawParameters(x + 12, y + lineHeight * 7);
			this.drawEquipments(x + 272, y + lineHeight * 7);
		}
	};

	Window_PartyManager_ActorInfo.prototype.setActor = function(actor) {
		this._actor = actor;
		this.refresh();
	};

	Window_PartyManager_ActorInfo.prototype.drawParameters = function(x, y) {
		const lineHeight = this.lineHeight();
		for (let i = 0; i < 6; i++) {
			let paramId = i + 2;
			let y2 = y + lineHeight * i;
			this.changeTextColor(this.systemColor());
			this.drawText(TextManager.param(paramId), x, y2, 160);
			this.resetTextColor();
			this.drawText(this._actor.param(paramId), x + 160, y2, 60, 'right');
		}
	};

	Window_PartyManager_ActorInfo.prototype.drawEquipments = function(x, y) {
		const equips = this._actor.equips();
		const count = Math.min(equips.length, this.maxEquipmentLines());
		for (let i = 0; i < count; i++) {
			this.drawItemName(equips[i], x, y + this.lineHeight() * i);
		}
	};

	Window_PartyManager_ActorInfo.prototype.maxEquipmentLines = function() {
		return 6;
	};

	Window_PartyManager_ActorInfo.prototype.drawHorzLine = function(y) {
		const lineY = y + this.lineHeight() / 2 - 1;
		this.contents.paintOpacity = 48;
		this.contents.fillRect(0, lineY, this.contentsWidth(), 2, this.lineColor());
		this.contents.paintOpacity = 255;
	};

	Window_PartyManager_ActorInfo.prototype.lineColor = function() {
		return this.normalColor();
	};

	//--------------------------------------------------------------------------
	// Window_PartyManager_HelpText
	//
	// New in v1.3, displays context-sensitive help text below actor status.

	function Window_PartyManager_HelpText() {
		this.initialize.apply(this, arguments);
	}

	Window_PartyManager_HelpText.prototype = Object.create(Window_Base.prototype);
	Window_PartyManager_HelpText.prototype.constructor = Window_PartyManager_HelpText;

	Window_PartyManager_HelpText.prototype.initialize = function(x, y, w) {
		this._helpString = null;
		Window_Base.prototype.initialize.call(this, x, y, w, this.fittingHeight(1));
		this.refresh();
	};

	Window_PartyManager_HelpText.prototype.setText = function(txt) {
		this._helpString = txt;
		this.refresh();
	};

	Window_PartyManager_HelpText.prototype.refresh = function() {
		this.contents.clear();
		if ( this._helpString ) {
			this.drawText(this._helpString, 0, this.contentsHeight() / 2 - this.lineHeight() / 2, this.contentsWidth(), 'center');
		}
	};

})(MRTS.PartyManager);
