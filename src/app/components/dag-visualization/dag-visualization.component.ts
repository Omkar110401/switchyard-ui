import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter, ViewChild, ElementRef, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../services/workflow.service';

declare const cytoscape: any;

@Component({
  selector: 'app-dag-visualization',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dag-visualization.component.html',
  styleUrl: './dag-visualization.component.scss',
})
export class DagVisualizationComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() tasks: Task[] = [];
  @Output() taskSelected = new EventEmitter<Task>();

  @ViewChild('cyContainer', { static: false }) cyContainer!: ElementRef;

  private cy: any;
  selectedTaskId: string | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    if (typeof cytoscape === 'undefined') {
      console.error('Cytoscape.js not loaded');
    }
  }

  ngAfterViewInit() {
    // Wait for both container and Dagre layout to be ready
    setTimeout(() => {
      this.initializeCytoscape();
    }, 200);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tasks'] && this.cy && this.tasks.length > 0) {
      this.updateVisualization();
    }
  }

  private initializeCytoscape() {
    if (!this.cyContainer || !this.cyContainer.nativeElement) {
      console.error('DAG container not ready');
      return;
    }

    const elements = this.buildElements();

    try {
      this.cy = cytoscape({
        container: this.cyContainer.nativeElement,
        elements: elements,
        style: this.getStyles(),
        layout: this.getLayout(),
        wheelSensitivity: 0.1,
        minZoom: 0.5,
        maxZoom: 3,
      });
    } catch (error) {
      console.error('Failed to initialize Cytoscape:', error);
      return;
    }

    this.cy.on('tap', 'node', (evt: any) => {
      const nodeId = evt.target.id();
      const task = this.tasks.find(t => t.id === nodeId);
      if (task) {
        this.selectedTaskId = nodeId;
        this.taskSelected.emit(task);
        this.updateNodeSelection();
      }
    });

    this.cy.on('tap', (evt: any) => {
      if (evt.target === this.cy) {
        this.selectedTaskId = null;
        this.updateNodeSelection();
      }
    });

    this.cy.fit();
  }

  private buildElements() {
    const elements: any[] = [];

    // Create nodes for all tasks
    this.tasks.forEach((task, index) => {
      elements.push({
        data: {
          id: task.id,
          label: task.key,
          status: task.status,
          index: index + 1,
          attempt: task.attempt_number,
          maxAttempts: task.max_attempts,
        },
      });
    });

    // Create edges based on dependencies
    this.tasks.forEach((task, index) => {
      // Priority 1: Use explicit depends_on from backend (if field exists)
      if (task.hasOwnProperty('depends_on')) {
        // Backend sent depends_on field - use it, even if empty
        if (task.depends_on && task.depends_on.length > 0) {
          task.depends_on.forEach((dependencyId) => {
            const sourceTask = this.tasks.find(t => t.id === dependencyId);
            if (sourceTask) {
              elements.push({
                data: {
                  id: `${sourceTask.id}-${task.id}`,
                  source: sourceTask.id,
                  target: task.id,
                },
              });
            }
          });
        }
        // If depends_on is empty array, no edges created (parallel execution)
      } else if (index > 0) {
        // Priority 2: No depends_on field from backend - infer from timing
        const prevTask = this.tasks[index - 1];

        if (prevTask.completed_at && task.started_at) {
          const prevEnd = new Date(prevTask.completed_at).getTime();
          const currStart = new Date(task.started_at).getTime();

          // Only create edge if task started significantly after previous completed
          if (currStart > prevEnd + 100) { // Task started after previous completed
            elements.push({
              data: {
                id: `${prevTask.id}-${task.id}`,
                source: prevTask.id,
                target: task.id,
              },
            });
          }
        } else if (!prevTask.started_at && !task.started_at) {
          // Both pending/ready - infer sequential from order
          elements.push({
            data: {
              id: `${prevTask.id}-${task.id}`,
              source: prevTask.id,
              target: task.id,
            },
          });
        }
      }
    });

    return elements;
  }

  private getStyles() {
    const statusColors: Record<string, string> = {
      pending: '#94a3b8',
      ready: '#3b82f6',
      running: '#06b6d4',
      succeeded: '#10b981',
      failed: '#ef4444',
      retrying: '#f59e0b',
    };

    return [
      {
        selector: 'node',
        style: {
          'background-color': (ele: any) => statusColors[ele.data('status')] || '#94a3b8',
          label: (ele: any) => `${ele.data('index')}`,
          width: 64,
          height: 64,
          'font-size': 18,
          'font-weight': 'bold',
          color: '#fff',
          'text-valign': 'center',
          'text-halign': 'center',
          'border-width': 2,
          'border-color': '#fff',
          'outline-width': 0,
        },
      },
      {
        selector: 'node:selected',
        style: {
          'border-width': 4,
          'border-color': '#0284c7',
          width: 72,
          height: 72,
          'outline-width': 0,
        },
      },
      {
        selector: 'edge',
        style: {
          'line-color': '#cbd5e1',
          'target-arrow-color': '#cbd5e1',
          'target-arrow-shape': 'triangle',
          'target-arrow-fill': 'filled',
          width: 2.5,
          'curve-style': 'straight',
        },
      },
    ];
  }

  private getLayout() {
    const isLinear = this.isLinearWorkflow();

    if (isLinear) {
      // For linear workflows, use breadthfirst
      return {
        name: 'breadthfirst',
        directed: true,
        roots: this.tasks.filter(t => !t.depends_on || t.depends_on.length === 0).map(t => `#${t.id}`),
        spacingFactor: 2,
        avoidOverlap: true,
      };
    } else {
      // For branching/complex workflows, use cose (force-directed)
      return {
        name: 'cose',
        directed: true,
        animate: false,
        animationDuration: 0,
        avoidOverlap: true,
        nodeSpacing: 30,
        nodeDimensionsIncludeLabels: true,
        randomize: false,
        componentSpacing: 100,
        gravity: 0.5,
      };
    }
  }

  private isLinearWorkflow(): boolean {
    // Check if workflow is purely linear (each node has at most 1 child)
    const childCounts: Record<string, number> = {};
    this.tasks.forEach(task => {
      if (task.depends_on && task.depends_on.length > 0) {
        task.depends_on.forEach(dep => {
          childCounts[dep] = (childCounts[dep] || 0) + 1;
        });
      }
    });

    // If any node has more than 1 child, it's not linear
    return Object.values(childCounts).every(count => count <= 1);
  }

  private updateVisualization() {
    if (!this.cy) return;

    this.cy.elements('node').forEach((node: any) => {
      const task = this.tasks.find(t => t.id === node.id());
      if (task) {
        node.data('status', task.status);
        node.data('attempt', task.attempt_number);
      }
    });

    this.updateNodeSelection();
  }

  private updateNodeSelection() {
    if (!this.cy) return;

    this.cy.elements('node').forEach((node: any) => {
      node.unselect();
    });

    if (this.selectedTaskId) {
      const selectedNode = this.cy.getElementById(this.selectedTaskId);
      if (selectedNode && selectedNode.length > 0) {
        selectedNode.select();
      }
    }
  }

  fitGraph() {
    if (this.cy) {
      this.cy.fit();
    }
  }

  resetZoom() {
    if (this.cy) {
      this.cy.fit();
    }
  }
}
