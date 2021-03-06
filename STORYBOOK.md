# Using Storybook and Nx to document component libraries

### www.github.com/nayfin/demo-co/blob/main/STORYBOOK.md

## Nx and Storybook Overview

### Nx

Nx is an extensible dev tool for monorepos. Find more information [here](https://nx.dev/). We're using it here because it will allow us to group multiple component libraries under a single repo, and to take advantage of some of it's plugins to configure our project for Storybook.

### Storybook

Storybook is a component development toolkit for React, Vue, Angular, Svelte and Ember. Storybook itself is designed to showcase components in isolation, but by integrating with other software (cypress, jest, compodoc, etc..) and developing useful addons, they are quickly building a platform to facilitate all stages of library development cycle:

- development
- testing
- review
- documentation
- release

## Storybook vs Demo app

The most common method of developing/testing/showcasing/documenting components is to create a demo app and create an example for each of feature of each component.  There are pros and cons to each method.

  ### Storybook

  **Pros:**

  - Isolated development, demos, unit  and e2e testing
  - Easily capture different states of component
  - Very fast onchange refreshes, and state is saved between onchange reloads
  - Easily publish documentation for users, and demos for designers and stakeholders
  - Markdown can be used for documentation and usage examples
  - Lots of supported frameworks
  - Evolving Rapidly: frequent release of new features

  **Cons:**

  - Controlling state of story is difficult, especially for Angular
  - React focused: Docs aren't as fleshed out for Angular and some features don't work as seamlessly
  - Evolving rapidly: frequent changes to API

  ### Demo App

  **Pros:**

  - Good for showing examples of complex usage and composition of multiple components
  - Can serve as example of Angular best practices for rest of organization
  - Can verify that there are no issues with library after it is published

  **Cons:**

  - Lots of extra work creating structure, setting up routes, etc...
  - Capturing all states is tedious and time consuming
  - Difficult to provide meaningful documentation and usage examples

## Walkthrough

We'll go through setup and then implement some of Storybook's useful features. The heading of each step corresponds to a branch name in the repo with all the changes for that step.

### 00-editable-library

We are going to be working with a component library called `editable`. It's designed to facilitate inline editing of documents, similar to updating a single field in a JIRA ticket. Right now there is only a single component, but we'll add Storybook now. We want to make sure we are documenting these components as we build them to help ensure adoption in our organization.

### 01-installs-storybook

Add the Storybook plugin and addons to dev dependencies

```bash
npm i -D @nrwl/storybook @storybook/addon-essentials
```

Run Nx storybook schematic

```bash
nx g @nrwl/angular:storybook-configuration <project-name>
```

Now run storybook

```bash
nx run <project-name>:storybook
```

And we get an error, but this expected as our component depends on the `ReactiveFormsModule` and we haven't provided it in the story's configuration.

You can find more details on setup at [nx docs](https://nx.dev/latest/angular/plugins/storybook/overview).

### 02-import-required-modules

So import `ReactiveFormsModule` in the story and add it to the `moduleMetadata` property of the `primary` story.

```ts
// text.component.stories.ts
export const primary = () => ({
  moduleMetadata: {
    imports: [
      ReactiveFormsModule
    ]
  }
})
```

You'll notice the `knobs` generated in our story by the nx schematic. While these are great, Storybook is evolving rapidly, and the `knobs` API is being replaced with a new `controls` API.

### 03-convert-to-templated-stories

  Soon well replace the `knobs` with some `controls` but first let's just remove the `knobs` and create a template for our stories that we can use to represent different states. Replace entire `text.component.stories.ts` file with the following:

```ts
import { ReactiveFormsModule } from '@angular/forms';
import { IStory, Story } from '@storybook/angular';
import { TextComponent } from './text.component';

export default {
  // The title in sidenav for our group of stories for this component
  title: 'Editable Text Component'
}

// A template we can reuse to easily create a new story to represent each state of our component
const template: Story<TextComponent> = (args: TextComponent): IStory => ({
  // The component the story represents
  component: TextComponent,
  // Module dependencies can be configured here
  moduleMetadata: {
    imports: [ReactiveFormsModule]
  },
  // Declare property values that should be duplicated across stories here
  props: {
    textValue: 'initialValue',
    ...args
  }
});

// story representing editing state
export const editing = template.bind({});
editing.args = {
  state: 'editing',
};

// story representing editing state
export const displaying = template.bind({});
displaying.args = {
  state: 'displaying',
};

// story representing editing state
export const updating = template.bind({});
updating.args = {
  state: 'updating',
};
```

Now we have story to represent each state of our component. Next let's add the `essentials` addon and see what that gets us.

### 04-add-storybook-essentials

We already installed `@storybook/essentials` earlier, so we just need to update the configuration to use this API and we'll get a docs out of it for free.

First, replace `knobs` addon with `essentials` in `<workspace-name>/.storybook/main.js`.

```js
module.exports = {
  stories: [],
  addons: [
    "@storybook/addon-essentials"
  ]
};
```

Then, remove everything from `libs/<library-name>/.storybook/preview.js` but don't remove file, we'll need it later.

### 05-enhance-docs-with-compodoc

Compodoc is a great tool for auto-generating docs. We can leverage its output here so that we can enhance the docs generated by storybook.

```bash
nx add @twittwer/compodoc
nx g @twittwer/compodoc:config <project-name>
```

#### NOTE: Compodoc can now be run with the following commands

  ```bash
  // HTML Format
  nx run <project>:compodoc
  // JSON Format
  nx run <project>:compodoc:json
  ```

Configure new commands targets in `angular.json` file to :

```json
{
  "projects": {
    "<project-name>": {
      "architect": {
        "storybook": {
          /* existing @nrwl/storybook config */
        },
        "build-storybook": {
          /*  existing @nrwl/storybook config */
        },
        "compodoc": {
          /* existing @twittwer/compodoc config */
        },
        "storydoc": {
          "builder": "@nrwl/workspace:run-commands",
          "options": {
            "commands": [
              "npx nx run <project>:compodoc:json --watch",
              "npx nx run <project>:storybook"
            ]
          }
        },
        "build-storydoc": {
          "builder": "@nrwl/workspace:run-commands",
          "options": {
            "commands": [
              "npx nx run <project>:compodoc:json",
              "npx nx run <project>:build-storybook"
            ]
          }
        }
      }
    }
  }
}
```

Tell Storybook where to find the generated docs JSON in `.storybook/preview.js` file.

```js
import { setCompodocJson } from '@storybook/addon-docs/angular';
import compodocJson from '../../../dist/compodoc/editable/documentation.json';

setCompodocJson(compodocJson);
```

And the last step is in the `text.component.stories.ts` file. We just need to assign a story to the default export.

```ts
export default {
  // The title in sidenav for our group of stories for this component
  title: 'Editable Text Component',
  // Connects the story to the generated docs
  component: TextComponent
}
```

Now we can add some comments to the properties of the `TextComponent` code and it will be reflected in our Storybook docs.

```ts
export class TextComponent implements OnInit {
  /**
   * Controls background color of control
   */
  @Input() @HostBinding('style.background') backgroundColor = `#D0B0DA`;
  /**
   * Controls interactive state of control
   */
  @Input() state: EditableState = 'editing';
  ...
}
```

### 06-enhance-controls

We have controls working, but let's refine the `controls` so that they only allow appropriate values. To do this we simply update the `default` export in `text.component.stories.ts` like so:

```ts
export default {
  // The title in sidenav for our group of stories for this component
  title: 'Editable Text Component',
  // Connects the story to the generated docs
  component: TextComponent,
  // Refine Storybook controls here
  argTypes: {
    // use color picker to control backgroundColor input
    backgroundColor: { control: 'color'},
    // use select to control state input
    state: {
      control: {
        type: 'select',
        options: ['displaying', 'editing', 'updating']
      }
    }
  }
}
```

### 07-use-storybook-actions-to-monitor-outputs

Now let's add some actions. Actions allow us to hook into any of the component's and, Here we'll use them to check the values emitted by our outputs. We'll make it easy to reuse them by creating an object of our actions in `text.component.ts`.

```ts
export default {
  ...
  argTypes: {
    // use actions to watch output events
    updateText: { action: 'updateText' },
    cancelEdit: { action: 'cancelEdit' },
    startEdit: { action: 'startEdit' },
  },
  ...
}
```

### 08-template-usage

If we like we can create a template for our story. This allows us to add `HTML` to story and even use multiple components together.

```ts
export const withTemplate: Story<TextComponent> = (args: TextComponent): IStory => ({
  // Module dependencies can be configured here
  moduleMetadata: {
    imports: [ReactiveFormsModule],
    declarations: [TextComponent]
  },
  // Declare property values that should be duplicated across stories here
  props: {
    ...args
  },
  template: `
    <h2>Displaying</h2>
    <editable-text [textValue]="'initialValue'" [state]="'displaying'"></editable-text>
    <h2>Editing</h2>
    <editable-text [textValue]="'initialValue'" [state]="'editing'"></editable-text>
    <h2>Updating</h2>
    <editable-text [textValue]="'initialValue'" [state]="'updating'"></editable-text>
  `
});
```

### 09-enhance-docs-with-mdx

For even further customization of documentation we can use `mdx`. MDX is an authorable format that lets you seamlessly write JSX in your Markdown documents. Since each Storybook story is a React component, we can write documentation in Markdown and easily interweave our example stories in line. The Nx Storybook schematic we ran earlier configure the project to use `mdx` files so all we have to do is create a file `text.component.stories.mdx` and add the following.

```html
<!-- Import our dependancies for the stories -->
import { ReactiveFormsModule } from '@angular/forms';
import { TextComponent } from './text.component.ts';

<!-- As well as some built in storybook components that we'll use in the documentation -->
import { Meta, Story, ArgsTable } from '@storybook/addon-docs/blocks';

<!-- The meta component tells Storybook the title of the story and which component it's for -->
<Meta title='Editable Text Component/MDX' component={TextComponent} />

# Editable Text Component

Some **markdown** description, or whatever you want

## Visual States

### displaying

<!-- Configure the story using the Story component -->
<Story name="basic" height="60px">
  {{
    component: TextComponent,
    moduleMetadata: {
      imports: [ReactiveFormsModule]
    },
    props: {
      state: 'displaying',
      textValue: 'Initial Value'
    }
  }}
</Story>

    <!-- Use a code snippet to show users an example of usage -->
    ```html
      <!-- example.component.html -->
      <editable-text
        [textValue]="'Initial Value'"
        [state]="'displaying'"
        (startEdit)="handleStartEdit()"
        (cancelEdit)="handleCancelEdit()"
        (updateText)="handleUpdateText($event)">
      </editable-text>
    ```

## ArgsTable
<!-- Use the ArgTable component to display property definitions for component -->
<ArgsTable of={TextComponent} />
```



## Resources

* [Overview](https://nx.dev/latest/angular/plugins/storybook/overview) of Nx Storybook Plugin
* Storybook For Angular [Tutorial](https://www.learnstorybook.com/intro-to-storybook/angular/en/get-started/): In depth look at how to connect Storybook to an Angular CLI app and some of the ways it can help boost collaboration and code quality.
* Nx Compodoc Plugin [documentation](https://github.com/twittwer/nx-tools/tree/master/libs/compodoc#readme). Specifically, check "How to integrate with `@nrwl/storybook`?" details near the bottom of the page.
