const javaTemplate = `/*
 * Created on May 21, 2004
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package com.acropoint.pos.table.gui.impl;

import java.util.Vector;

import org.eclipse.swt.SWT;
import org.eclipse.swt.graphics.Color;
import org.eclipse.swt.graphics.FontData;
import org.eclipse.swt.graphics.RGB;
import org.eclipse.swt.layout.FillLayout;
import org.eclipse.swt.layout.FormAttachment;
import org.eclipse.swt.layout.FormLayout;
import org.eclipse.swt.layout.GridData;
import org.eclipse.swt.layout.GridLayout;
import org.eclipse.swt.layout.RowLayout;
import org.eclipse.swt.widgets.Composite;
import org.eclipse.swt.widgets.Group;
import org.eclipse.swt.widgets.Label;

import com.acropoint.pos.swtMainFrame;
import com.acropoint.pos.main.gui.APPanel;
import com.acropoint.pos.table.gui.DynamicTablePanelScroll;
import com.acropoint.pos.table.gui.TableButtonLayout;
import com.acropoint.pos.table.gui.button.TableButton;
import com.acropoint.pos.table.model.TableData;
import com.acropoint.pos.util.AppConst;

/**
 * @author dfelty
 * 
 *         To change the template for this generated type comment go to
 *         Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class TablePanelImplKula[NAME] extends TableButtonLayout
{
	private final static int TABLE_CNT = [table count];
	private final static int COUNTER_CNT = [counter count];
	private final static int BAR_CNT = [bar count];
	private final static int ENTRANCE_TABLE_NUM = TABLE_CNT + COUNTER_CNT + BAR_CNT;

	public final static int COUNTER_BUTTON_WIDTH = [counter width];
	public final static int COUNTER_BUTTON_HEIGHT = [counter height];
	public final static int BAR_BUTTON_WIDTH = [bar width];
	public final static int BAR_BUTTON_HEIGHT = [bar height];

	public final static int TABLE_BUTTON_WIDTH = [table width];
	public final static int TABLE_BUTTON_HEIGHT = [table height];
	public final static int TOGO_BUTTON_WIDTH = [togo width];
	public final static int TOGO_BUTTON_HEIGHT = [togo height];

	/**
	 * This method initializes
	 * 
	 */
	public TablePanelImplKula[NAME](DynamicTablePanelScroll parent,
			Vector<TableData> tables)
	{
		super(parent, tables);
	}

	protected void initialize()
	{
		FillLayout layout = new FillLayout(SWT.HORIZONTAL);
		layout.spacing = 150;
		layout.marginHeight = 0;
		layout.marginWidth = 0;
		setLayout(layout);

		APPanel leftPanel = new APPanel(this, SWT.NORMAL);
		leftPanel.setBackground(color);
		getEntranceAreaPanel(leftPanel);

		layout();

		disableSelected();
	}

	private void getEntranceAreaPanel(Composite parent)
	{
		// set entrance area panel layout
		FormLayout playout = new FormLayout();
		playout.spacing = 0;
		playout.marginLeft = 0;
		playout.marginRight = 0;
		playout.marginBottom = 0;
		playout.marginTop = 0;
		parent.setLayout(playout);

		Color tableSectionBackground = swtMainFrame.getInstance().getResourceManager().getColor(new RGB([table color]));
		Color counterSectionBackground = swtMainFrame.getInstance().getResourceManager().getColor(new RGB([counter color]));
		Color barSectionBackground = swtMainFrame.getInstance().getResourceManager().getColor(new RGB([bar color]));
		Color togoSectionBackground = swtMainFrame.getInstance().getResourceManager().getColor(new RGB([togo color]));
		
{}

        this.pack();
	}
}`;

const XMLTemplate = `<tableLayoutGUIType xmlns="http://www.acropoint.com/rest/domains/session_data">
<table class="java.util.ArrayList">
	
{}

   
</table>
<background R="250" G="250" B="250"/>
<status class="java.util.ArrayList">
   <tableStatus _id="0">
	  <color R="0" G="200" B="200"/>
	  <name>NULL</name>
   </tableStatus>
   <tableStatus _id="1">
	  <color R="100" G="100" B="200"/>
	  <name>Draft</name>
   </tableStatus>
   <tableStatus _id="2">
	  <color R="200" G="0" B="0"/>
	  <name>Ordered</name>
   </tableStatus>
   <tableStatus _id="3">
	  <color R="200" G="200" B="0"/>
	  <name>Payment</name>
   </tableStatus>
   <tableStatus _id="4">
	  <color R="0" G="200" B="0"/>
	  <name>Completed</name>
   </tableStatus>
   <tableStatus _id="5">
	  <color R="200" G="0" B="200"/>
	  <name>Multiple</name>
   </tableStatus>
</status>
</tableLayoutGUIType>`;