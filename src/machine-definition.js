"use strict";

import { assign, createMachine } from "xstate";

const initialContext = {
  outputs: [0],
  inputs: [0],
  index: 0,
};

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
        return {
          ...context,
          inputs: [...context.inputs, event.input],
        };
      }),

      stop: assign((context, event) => {
        const outputs = [...context.outputs, event.output];

        return {
          ...context,
          outputs,
          index: context.index + 1,
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
          typeof event.index === "undefined" ||
          event.index < initialContext.index ||
          event.index > last
        ) {
          return false;
        }

        return true;
      },

      undoable: (context, _event) => {
        if (context.index <= initialContext.index) {
          return false;
        }

        return true;
      },

      redoable: (context, _event) => {
        const last = context.outputs.length - 1;

        if (context.index === last) {
          return false;
        }

        return true;
      },
    },
  },
);
