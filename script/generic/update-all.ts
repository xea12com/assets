import { SmartchainAction } from "../blockchain/smartchain";
import { EthereumAction } from "../blockchain/ethereum";
import { AssetInfos } from "../generic/asset-infos";
import { EthForks } from "../generic/eth-forks";
import { FoldersFiles } from "../generic/folders-and-files";
import { JsonAction } from "../generic/json-format";
import { LogoSize } from "../generic/logo-size";
import { ActionInterface, CheckStepInterface } from "../generic/interface";
import * as chalk from 'chalk';
import * as bluebird from "bluebird";

const actionList: ActionInterface[] = [
    new FoldersFiles(),
    new AssetInfos(),
    new EthForks(),
    new LogoSize(),
    new JsonAction(),
    // chains:
    new SmartchainAction(),
    new EthereumAction(),
];

const maxErrosFromOneCheck = 5;

async function checkStepList(steps: CheckStepInterface[]): Promise<[string[], string[]]> {
    const errorsAll: string[] = [];
    const warningsAll: string[] = [];
    await bluebird.each(steps, async (step) => {
        try {
            //console.log(`     Running check step '${step.getName()}'...`);
            const [errors, warnings] = await step.check();
            if (errors && errors.length > 0) {
                console.log(`-  ${chalk.red('X')} '${step.getName()}':  ${errors.length} errors`);
                let cnt = 0;
                errors.forEach(err => {
                    if (cnt < maxErrosFromOneCheck) {
                        console.log(`   ${chalk.red('X')}   '${err}'`);
                        errorsAll.push(err);
                    } else if (cnt == maxErrosFromOneCheck) {
                        console.log(`   ${chalk.red('X')}   ${errors.length} errors in total, omitting rest ...`);
                    }
                    cnt++;
                });
            }
            if (warnings && warnings.length > 0) {
                console.log(`-  ${chalk.yellow('!')} '${step.getName()}':  ${warnings.length} warnings`);
                let cnt = 0;
                warnings.forEach(warn => {
                    if (cnt < maxErrosFromOneCheck) {
                        console.log(`   ${chalk.yellow('!')}   '${warn}'`);
                        warningsAll.push(warn);
                    } else if (cnt == maxErrosFromOneCheck) {
                        console.log(`   ${chalk.yellow('!')}   ${warnings.length} warnings in total, omitting rest ...`);
                    }
                    cnt++;
                });
            }
            if (errors.length == 0 && warnings.length == 0) {
                console.log(`-  ${chalk.green('✓')} '${step.getName()}' OK`);
            }
        } catch (error) {
            console.log(`-  ${chalk.red('X')} '${step.getName()}': Caught error: ${error.message}`);
            errorsAll.push(`${step.getName()}: Exception: ${error.message}`);
        }
    });
    return [errorsAll, warningsAll];
}

async function sanityCheckByActionList(actions: ActionInterface[]): Promise<[string[], string[]]> {
    console.log("Running sanity checks...");
    const errors: string[] = [];
    const warnings: string[] = [];
    await bluebird.each(actions, async (action) => {
        try {
            if (action.getSanityChecks) {
                const steps = action.getSanityChecks();
                if (steps && steps.length > 0) {
                    console.log(`   Action '${action.getName()}' has ${steps.length} check steps`);
                    const [errors1, warnings1] = await checkStepList(steps);
                    if (errors1.length > 0) {
                        errors1.forEach(e => errors.push(e));
                    }
                    if (warnings1.length > 0) {
                        warnings1.forEach(w => warnings.push(w));
                    }
                    if (errors1.length == 0 && warnings1.length == 0) {
                        console.log(`- ${chalk.green('✓')} Action '${action.getName()}' OK, all ${steps.length} steps`);
                    }
                }
            }
        } catch (error) {
            console.log(`-  ${chalk.red('X')} '${action.getName()}' Caught error: ${error.message}`);
            errors.push(`${action.getName()}: Exception: ${error.message}`);
        }
    });
    console.log(`All sanity checks done, found ${errors.length} errors, ${warnings.length} warnings`);
    return [errors, warnings];
}

async function consistencyCheckByActionList(actions: ActionInterface[]): Promise<[string[], string[]]> {
    console.log("Running consistency checks...");
    const errors: string[] = [];
    const warnings: string[] = [];
    await bluebird.each(actions, async (action) => {
        try {
            if (action.getConsistencyChecks) {
                const steps = action.getConsistencyChecks();
                if (steps && steps.length > 0) {
                    console.log(`   Action '${action.getName()}' has ${steps.length} check steps`);
                    const [errors1, warnings1] = await checkStepList(steps);
                    if (errors1.length > 0) {
                        errors1.forEach(e => errors.push(e));
                    }
                    if (warnings1.length > 0) {
                        warnings1.forEach(w => warnings.push(w));
                    }
                    if (errors1.length == 0 && warnings1.length == 0) {
                        console.log(`- ${chalk.green('✓')} Action '${action.getName()}' OK, all ${steps.length} steps`);
                    }
                }
            }
        } catch (error) {
            console.log(`-  ${chalk.red('X')} '${action.getName()}' Caught error: ${error.message}`);
            errors.push(`${action.getName()}: Exception: ${error.message}`);
        }
    });
    console.log(`All consistency checks done, found ${errors.length} errors, ${warnings.length} warnings`);
    return [errors, warnings];
}

async function sanityFixByList(actions: ActionInterface[]) {
    console.log("Running sanity fixes...");
    await bluebird.each(actions, async (action) => {
        try {
            if (action.sanityFix) {
                console.log(`Sanity fix '${action.getName()}':`);
                await action.sanityFix();
            }
        } catch (error) {
            console.log(`Caught error: ${error.message}`);
        }
    });
    console.log("All sanity fixes done.");
}

async function consistencyFixByList(actions: ActionInterface[]) {
    console.log("Running consistency fixes...");
    await bluebird.each(actions, async (action) => {
        try {
            if (action.consistencyFix) {
                console.log(`Sanity fix '${action.getName()}':`);
                await action.consistencyFix();
            }
        } catch (error) {
            console.log(`Caught error: ${error.message}`);
        }
    });
    console.log("All consistency fixes done.");
}

async function updateAutoByList(actions: ActionInterface[]) {
    console.log("Running auto updates (using external data sources) ...");
    await bluebird.each(actions, async (action) => {
        try {
            if (action.updateAuto) {
                console.log(`Auto update '${action.getName()}':`);
                await action.updateAuto();
            }
        } catch (error) {
            console.log(`Caught error: ${error.message}`);
        }
    });
    console.log("All auto updates done.");
}

async function updateManualByList(actions: ActionInterface[]) {
    console.log("Running manual updates (using external data sources) ...");
    await bluebird.each(actions, async (action) => {
        try {
            if (action.updateManual) {
                console.log(`Manual update '${action.getName()}':`);
                await action.updateManual();
            }
        } catch (error) {
            console.log(`Caught error: ${error.message}`);
        }
    });
    console.log("All manual updates done.");
}

export async function sanityCheckAll(): Promise<[string[], string[]]> {
    return await sanityCheckByActionList(actionList);
}

export async function consistencyCheckAll(): Promise<[string[], string[]]> {
    return await consistencyCheckByActionList(actionList);
}

export async function sanityFixAll(): Promise<void> {
    await sanityFixByList(actionList);
}

export async function consistencyFixAll(): Promise<void> {
    await consistencyFixByList(actionList);
}

export async function updateAutoAll(): Promise<void> {
    await updateAutoByList(actionList);
}

export async function updateManualAll(): Promise<void> {
    await updateManualByList(actionList);
}
