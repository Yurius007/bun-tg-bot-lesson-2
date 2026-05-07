import { Keyboard } from "grammy";

export const ADD_MEAL = "➕ Add meal";
export const TODAY = "📊 Today";
export const SET_PROFILE = "⚙️ Set profile";

export const mainMenu = new Keyboard()
  .text(ADD_MEAL)
  .text(TODAY)
  .row()
  .text(SET_PROFILE)
  .resized();
