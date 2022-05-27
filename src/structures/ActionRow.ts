import { ComponentType } from "discord-api-types/v10";
import type Button from "./Button.js";
import type SelectMenu from "./SelectMenu.js";

class ActionRow {
  type = ComponentType.ActionRow;
  components: (Button | SelectMenu)[] = [];

  constructor(data = {}) {
    Object.assign(this, data);
    return this;
  }

  addButton(button: Button) {
    this.components.push(button);
    return this;
  }

  addSelectMenu(selectMenu: SelectMenu) {
    this.components.push(selectMenu);
    return this;
  }
}

export default ActionRow;
