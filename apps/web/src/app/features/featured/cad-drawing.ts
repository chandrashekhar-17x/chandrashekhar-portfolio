import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Recreated CAD illustration for the featured band (no employer visuals).
 * Plays once as a sequence: lines → arcs → text → R-tree boxes → selection → diff.
 * Only opacity/transform animate; reduced motion shows the final frame.
 */
@Component({
  selector: 'app-cad-drawing',
  templateUrl: './cad-drawing.html',
  styleUrl: './cad-drawing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CadDrawing {}
