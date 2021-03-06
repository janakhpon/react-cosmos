// @flow

import React from 'react';
import {
  getCompFixtureStates,
  updateCompFixtureState
} from 'react-cosmos-shared2/fixtureState';
import { uuid } from 'react-cosmos-shared2/util';
import { HelloMessage, HelloMessageCls } from '../testHelpers/components';
import { createCompFxState, createFxValues } from '../testHelpers/fixtureState';
import { runTests, mount } from '../testHelpers';

const rendererId = uuid();
const fixtures = {
  first: <HelloMessage name="Bianca" />
};
const decorators = {};

runTests(mockConnect => {
  it('captures props', async () => {
    await mockConnect(async ({ getElement, selectFixture, untilMessage }) => {
      await mount(
        getElement({ rendererId, fixtures, decorators }),
        async renderer => {
          await selectFixture({
            rendererId,
            fixturePath: 'first',
            fixtureState: null
          });

          expect(renderer.toJSON()).toBe('Hello Bianca');

          await untilMessage({
            type: 'fixtureStateChange',
            payload: {
              rendererId,
              fixturePath: 'first',
              fixtureState: {
                components: [
                  createCompFxState({
                    componentName: 'HelloMessage',
                    props: createFxValues({ name: 'Bianca' })
                  })
                ]
              }
            }
          });
        }
      );
    });
  });

  it('overwrites prop', async () => {
    await mockConnect(
      async ({
        getElement,
        selectFixture,
        getLastFixtureState,
        setFixtureState
      }) => {
        await mount(
          getElement({ rendererId, fixtures, decorators }),
          async renderer => {
            await selectFixture({
              rendererId,
              fixturePath: 'first',
              fixtureState: null
            });

            const fixtureState = await getLastFixtureState();
            const [{ decoratorId, elPath }] = getCompFixtureStates(
              fixtureState
            );

            await setFixtureState({
              rendererId,
              fixturePath: 'first',
              fixtureState: {
                components: updateCompFixtureState({
                  fixtureState,
                  decoratorId,
                  elPath,
                  props: createFxValues({ name: 'B' })
                })
              }
            });

            expect(renderer.toJSON()).toBe('Hello B');
          }
        );
      }
    );
  });

  it('removes prop', async () => {
    await mockConnect(
      async ({
        getElement,
        selectFixture,
        getLastFixtureState,
        setFixtureState
      }) => {
        await mount(
          getElement({ rendererId, fixtures, decorators }),
          async renderer => {
            await selectFixture({
              rendererId,
              fixturePath: 'first',
              fixtureState: null
            });

            const fixtureState = await getLastFixtureState();
            const [{ decoratorId, elPath }] = getCompFixtureStates(
              fixtureState
            );

            await setFixtureState({
              rendererId,
              fixturePath: 'first',
              fixtureState: {
                components: updateCompFixtureState({
                  fixtureState,
                  decoratorId,
                  elPath,
                  props: []
                })
              }
            });

            expect(renderer.toJSON()).toBe('Hello Stranger');
          }
        );
      }
    );
  });

  it('clears props', async () => {
    await mockConnect(
      async ({
        getElement,
        selectFixture,
        untilMessage,
        getLastFixtureState,
        setFixtureState
      }) => {
        await mount(
          getElement({ rendererId, fixtures, decorators }),
          async renderer => {
            await selectFixture({
              rendererId,
              fixturePath: 'first',
              fixtureState: null
            });

            const fixtureState = await getLastFixtureState();
            const [{ decoratorId, elPath }] = getCompFixtureStates(
              fixtureState
            );

            await setFixtureState({
              rendererId,
              fixturePath: 'first',
              fixtureState: {
                components: updateCompFixtureState({
                  fixtureState,
                  decoratorId,
                  elPath,
                  props: createFxValues({ name: 'B' })
                })
              }
            });

            expect(renderer.toJSON()).toBe('Hello B');

            await setFixtureState({
              rendererId,
              fixturePath: 'first',
              fixtureState: {
                components: updateCompFixtureState({
                  fixtureState,
                  decoratorId,
                  elPath,
                  props: null
                })
              }
            });

            expect(renderer.toJSON()).toBe('Hello Bianca');

            // After the props are removed from the fixture state, the original
            // props are added back through a fixtureStateChange message
            await untilMessage({
              type: 'fixtureStateChange',
              payload: {
                rendererId,
                fixturePath: 'first',
                fixtureState: {
                  components: [
                    createCompFxState({
                      componentName: 'HelloMessage',
                      props: createFxValues({ name: 'Bianca' })
                    })
                  ]
                }
              }
            });
          }
        );
      }
    );
  });

  it('transitions props (reuses component instance)', async () => {
    await mockConnect(
      async ({
        getElement,
        selectFixture,
        getLastFixtureState,
        setFixtureState
      }) => {
        const rendererId = uuid();
        const getFixtures = ref => ({
          first: <HelloMessageCls ref={ref} name="Bianca" />
        });
        let ref1, ref2;

        await mount(
          getElement({
            rendererId,
            fixtures: getFixtures(elRef => {
              if (elRef && !ref1) ref1 = elRef;
            }),
            decorators
          }),
          async renderer => {
            await selectFixture({
              rendererId,
              fixturePath: 'first',
              fixtureState: null
            });

            const fixtureState = await getLastFixtureState();
            const [{ decoratorId, elPath }] = getCompFixtureStates(
              fixtureState
            );

            await setFixtureState({
              rendererId,
              fixturePath: 'first',
              fixtureState: {
                components: updateCompFixtureState({
                  fixtureState,
                  decoratorId,
                  elPath,
                  props: createFxValues({ name: 'B' })
                })
              }
            });

            renderer.update(
              getElement({
                rendererId,
                fixtures: getFixtures(elRef => {
                  if (elRef) ref2 = elRef;
                }),
                decorators
              })
            );

            expect(ref2).toBeTruthy();
            expect(ref2).toBe(ref1);
          }
        );
      }
    );
  });

  it('resets props (creates new component instance)', async () => {
    await mockConnect(
      async ({
        getElement,
        selectFixture,
        getLastFixtureState,
        setFixtureState
      }) => {
        const rendererId = uuid();
        const getFixtures = ref => ({
          first: <HelloMessageCls ref={ref} name="Bianca" />
        });
        let ref1, ref2;

        await mount(
          getElement({
            rendererId,
            fixtures: getFixtures(elRef => {
              if (elRef && !ref1) ref1 = elRef;
            }),
            decorators
          }),
          async renderer => {
            await selectFixture({
              rendererId,
              fixturePath: 'first',
              fixtureState: null
            });

            const fixtureState = await getLastFixtureState();
            const [{ decoratorId, elPath }] = getCompFixtureStates(
              fixtureState
            );

            await setFixtureState({
              rendererId,
              fixturePath: 'first',
              fixtureState: {
                components: updateCompFixtureState({
                  fixtureState,
                  decoratorId,
                  elPath,
                  props: createFxValues({ name: 'B' }),
                  resetInstance: true
                })
              }
            });

            renderer.update(
              getElement({
                rendererId,
                fixtures: getFixtures(elRef => {
                  if (elRef) ref2 = elRef;
                }),
                decorators
              })
            );

            expect(ref1).toBeTruthy();
            expect(ref2).not.toBe(ref1);
          }
        );
      }
    );
  });

  it('overwrites fixture state on fixture change', async () => {
    await mockConnect(
      async ({
        getElement,
        untilMessage,
        getLastFixtureState,
        selectFixture,
        setFixtureState
      }) => {
        await mount(
          getElement({ rendererId, fixtures, decorators }),
          async renderer => {
            await selectFixture({
              rendererId,
              fixturePath: 'first',
              fixtureState: null
            });

            const fixtureState = await getLastFixtureState();
            const [{ decoratorId, elPath }] = getCompFixtureStates(
              fixtureState
            );

            await setFixtureState({
              rendererId,
              fixturePath: 'first',
              fixtureState: {
                components: updateCompFixtureState({
                  fixtureState,
                  decoratorId,
                  elPath,
                  props: createFxValues({ name: 'B' })
                })
              }
            });

            expect(renderer.toJSON()).toBe('Hello B');

            renderer.update(
              getElement({
                rendererId,
                fixtures: {
                  first: <HelloMessage name="Petec" />
                },
                decorators
              })
            );

            await untilMessage({
              type: 'fixtureStateChange',
              payload: {
                rendererId,
                fixturePath: 'first',
                fixtureState: {
                  components: [
                    createCompFxState({
                      componentName: 'HelloMessage',
                      props: createFxValues({ name: 'Petec' })
                    })
                  ]
                }
              }
            });

            expect(renderer.toJSON()).toBe('Hello Petec');
          }
        );
      }
    );
  });

  it('clears fixture state for removed fixture element', async () => {
    await mockConnect(async ({ getElement, untilMessage, selectFixture }) => {
      await mount(
        getElement({ rendererId, fixtures, decorators }),
        async renderer => {
          await selectFixture({
            rendererId,
            fixturePath: 'first',
            fixtureState: null
          });

          await untilMessage({
            type: 'fixtureStateChange',
            payload: {
              rendererId,
              fixturePath: 'first',
              fixtureState: {
                components: [
                  createCompFxState({
                    componentName: 'HelloMessage',
                    props: createFxValues({ name: 'Bianca' })
                  })
                ]
              }
            }
          });

          renderer.update(
            getElement({
              rendererId,
              fixtures: {
                // HelloMessage element from fixture is gone, and so should the
                // fixture state related to it.
                first: 'Hello all'
              },
              decorators
            })
          );

          expect(renderer.toJSON()).toBe('Hello all');

          await untilMessage({
            type: 'fixtureStateChange',
            payload: {
              rendererId,
              fixturePath: 'first',
              fixtureState: {
                components: []
              }
            }
          });
        }
      );
    });
  });
});
