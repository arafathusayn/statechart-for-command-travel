"use strict";

import { assign, createMachine } from "xstate";

export const initialContext = {
  outputs: [0],
  inputs: [0],
  index: 0,
};

/**
 * @param {typeof initialContext} context
 * @returns {boolean}
 */
export const canUndo = (context) => context.index > initialContext.index;

/**
 * @param {typeof initialContext} context
 * @returns {boolean}
 */
export const canRedo = (context) => context.index < context.outputs.length - 1;

export const commandMachine = createMachine(
  {
    id: "App",
    initial: "idle",
    context: initialContext,
    predictableActionArguments: true,

    states: {
      idle: {
        on: {
          COMMAND: {
            target: "running",
            actions: "start",
          },

          JUMP: {
            actions: "jump",
            cond: "jumpable",
          },

          UNDO: {
            actions: "undo",
            cond: "undoable",
          },

          REDO: {
            actions: "redo",
            cond: "redoable",
          },

          RESET: {
            actions: "reset",
          },
        },
      },

      running: {
        on: {
          STOP: {
            target: "idle",
            actions: "stop",
          },
        },
      },
    },

    schema: {
      // This Event Schema doesn't matter in JS-only mode
      events: {
        type: "string", // any arbitary value
        index: 0,
        input: 0,
        output: 0,
      },
    },
  },

  {
    actions: {
      start: assign((context, event) => {
        const inputs = [
          ...context.inputs.slice(0, context.index + 1),
          event.input,
        ];

        return {
          ...context,
          inputs,
          outputs: context.outputs.slice(0, context.index + 1),
        };
      }),

      stop: assign((context, event) => {
        const outputs = [
          ...context.outputs.slice(0, context.index + 1),
          event.output,
        ];

        return {
          ...context,
          outputs,
          index: outputs.length - 1,
        };
      }),

      jump: assign((context, event) => {
        return {
          ...context,
          index: event.index,
        };
      }),

      undo: assign((context, _event) => {
        return {
          ...context,
          index: context.index - 1,
        };
      }),

      redo: assign((context, _event) => {
        return {
          ...context,
          index: context.index + 1,
        };
      }),

      reset: assign(() => initialContext),
    },

    guards: {
      jumpable: (context, event) => {
        const last = context.outputs.length - 1;

        if (
          event.type !== "JUMP" ||
          event.index < initialContext.index ||
          event.index > last
        ) {
          return false;
        }

        return true;
      },

      undoable: (context, _event) => canUndo(context),

      redoable: (context, _event) => canRedo(context),
    },
  },
);
