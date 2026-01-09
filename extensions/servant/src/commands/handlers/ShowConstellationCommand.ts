import { CommandHandler } from '../CommandRegistry';
import { ConstellationViewPanel, type ConstellationOpenOptions } from '../../ui/ConstellationViewPanel';
import { NeuralDependencyGraph } from '../../neural/NeuralDependencyGraph';
import { GoalManager } from '../../goals/GoalManager';
import { ConstellationDataGenerator } from '../../constellation/ConstellationDataGenerator';
import * as vscode from 'vscode';

/**
 * 天体儀表示コマンド
 */
export class ShowConstellationCommand implements CommandHandler {
  readonly id = 'servant.showConstellation';

  constructor(
    private extensionUri: vscode.Uri,
    private graph: NeuralDependencyGraph,
    private goalManager: GoalManager,
    private generator: ConstellationDataGenerator
  ) {}

  execute(openOptions?: ConstellationOpenOptions): void {
    ConstellationViewPanel.createOrShow(
      this.extensionUri,
      this.graph,
      this.goalManager,
      this.generator,
      openOptions
    );
  }
}
